
var EffectsAndPresets;
var ResultList;

function GetPresetsFromFolder(folder)
{
    var presets = [];
    var filesAndFolders = folder.getFiles();

    for (var i = 0; i < filesAndFolders.length; i++)
    {
        var file = filesAndFolders[i];

        if (file instanceof File && file.name.match(/\.ffx$/i))
        {
            presets.push(
            {
                name: file.name.replace(/\.ffx$/, ""),
                file: file,
                isEffect: false
            });
        }
        else if (file instanceof Folder)
        {
            presets = presets.concat(GetPresetsFromFolder(file));
        }
    }

    return presets;
}

function GetAllEffectsAndPresets()
{
    var effectsList = [];
    var presetsFolder = new Folder(Folder.appPackage.fullName + "/Presets");
    var effects = app.effects;

    if (presetsFolder.exists)
    {
        effectsList = effectsList.concat(GetPresetsFromFolder(presetsFolder));
    }

    for (var i = 1; i <= effects.length; i++)
    {
        var effect = effects[i];
        if (effect)
        {
            effectsList.push(
            {
                name: effect.displayName,
                isEffect: true
            });
        }
    }

    return effectsList;
}

function ContainsIgnoreSpaces(source, input) 
{
    const normalizedSource = source.replace(' ', '');
    const normalizedInput = input.replace(' ', '');

    return normalizedSource.indexOf(normalizedInput) !== -1;
}


function UpdateResults(searchText)
{
    ResultList.removeAll();
    if (searchText && searchText.length > 0)
    {
        for (var i = 0; i < EffectsAndPresets.length; i++)
        {
            if (ContainsIgnoreSpaces(EffectsAndPresets[i].name.toLowerCase(),searchText.toLowerCase()))
            {
                ResultList.add("item", EffectsAndPresets[i].name);
            }
        }
    }
}

function ApplyEffectOrPreset(selectedName)
{
    var selectedLayers = app.project.activeItem.selectedLayers;

    if (selectedLayers.length === 0)
    {
        alert("Error: No Layer Selected");
        return;
    }

    for (var i = 0; i < EffectsAndPresets.length; i++)
    {
        if (EffectsAndPresets[i].name === selectedName)
        {
            app.beginUndoGroup("Apply Effect/Preset");

            if (EffectsAndPresets[i].isEffect)
            {
                // Apply effect
                for (var j = 0; j < selectedLayers.length; j++)
                {
                    var layer = selectedLayers[j];
                    layer.property("ADBE Effect Parade").addProperty(EffectsAndPresets[i].name);
                }
            }
            else
            {
                // Apply preset
                for (var j = 0; j < selectedLayers.length; j++)
                {
                    var layer = selectedLayers[j];
                    layer.applyPreset(EffectsAndPresets[i].file);
                }
            }

            app.endUndoGroup();
            break;
        }
    }
}

function Main(thisObj)
{
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "QuickSearch", undefined,
    {
        resizeable: false
    });

    var searchGroup = win.add("group");
    searchGroup.orientation = "row";
    var searchBar = searchGroup.add("edittext", undefined, "");
    searchBar.size = [300, 25]

    ResultList = win.add("listbox", undefined, [],
    {
        multiselect: false
    });
    ResultList.size = [300, 400];

    EffectsAndPresets = GetAllEffectsAndPresets();

    searchBar.onChanging = function()
    {
        UpdateResults(searchBar.text);
    };

    searchBar.addEventListener("keydown", function(event) 
    {
        if (event.keyName == "Down")
        {
            searchBar.active = false;
            ResultList.active = true;
            event.preventDefault();
        }
        else
        {
            searchBar.active = true;
            ResultList.active = false;
        }
    });

    ResultList.onDoubleClick = function()
    {
        if (ResultList.selection)
        {
            ApplyEffectOrPreset(ResultList.selection.text);
            win.close();
        }
    };

    ResultList.addEventListener("keydown", function(event) 
    {
        if (event.keyName == "Enter")
        {
            if (ResultList.selection)
            {
                ApplyEffectOrPreset(ResultList.selection.text);
                win.close();
                event.preventDefault();
            }
        }
    });

    win.onShow = function()
    {
        searchBar.active = true;
    };

    win.center();
    win.show();
}

Main(this);