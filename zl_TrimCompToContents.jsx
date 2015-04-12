{
    // zl_TrimCompToContents
    // Copyright (c) 2013 Zack Lovatt. All rights reserved.
    // zacklovatt.com
    //
    // Name: zl_TrimCompToContents
    // Version: 0.2
    //
    // Description:
    // This script trims or lengthens your current comp to the in & out
    // points of its contents.
    //
    // Originally requested by Alan Fregtman (darkvertex.com | @m0rph)
    // 
    // This script is provided "as is," without warranty of any kind, expressed
    // or implied. In no event shall the author be held liable for any damages 
    // arising in any way from the use of this script.


    // zl_TrimCompToContents()
    // 
    // Description:
    // This function contains the main logic for this script.
    // 
    // Parameters:
    // thisObj - "this" object.
    // 
    // Returns:
    // Nothing.
    //
    function zl_TrimCompToContents(thisObj){
        var thisComp = app.project.activeItem;
        var layerCount = thisComp.numLayers;

        // Find the current start time, set it to 0, set it back at the end
        var oldDispStartTime = thisComp.displayStartTime;
        thisComp.displayStartTime = 0;

        var userLayers = thisComp.selectedLayers;

        // !!!!!! NEED TO ADD USER CONTROL !!!!!!
        var useAll = true;
        var skipLocked = false;
        var preserveCompStart = true;
        
        // If useAll switch is enabled, set user layers to all layers
        if (useAll == true){
            var j = 0;
            
            for (i = 0; i <= thisComp.layers.length-1; i++){ 
                if (skipLocked == true && thisComp.layers[i+1].locked == false){
                    userLayers[j] = thisComp.layers[i+1];
                    j++;
                } else if (skipLocked == false){
                    userLayers[i] = thisComp.layers[i+1];
                }
            }
        }

    
        if ((useAll == true) && (userLayers.length == 0)){
            alert ("No layers detected!");
        } else if ((useAll == false) && (userLayers.length == 0)){
            alert ("No layers selected!");
        } else {       
            var inTime = zl_TrimCompToContents_getInTime(userLayers);
            var outTime = zl_TrimCompToContents_getOutTime(userLayers);

            // If the earliest layer is before comp start, shift everything down 
            if (inTime < thisComp.displayStartTime){
                    zl_TrimCompToContents_shiftLayers(userLayers, inTime);
                    inTime = zl_TrimCompToContents_getInTime(userLayers);
                    outTime = zl_TrimCompToContents_getOutTime(userLayers)
            }
        
            var newDur = outTime - inTime;

            // If the target duration will be less than one frame (sometimes happens for time-remapped
            // or previously trimmed precomps), set duration to 1 frame.
            if (newDur < thisComp.frameDuration){
                newDur = thisComp.frameDuration;
            }
            if (inTime < thisComp.frameDuration){
                inTime = thisComp.frameDuration;
            }
            if (thisComp.duration < outTime){
                thisComp.duration = newDur + inTime + 1;
            }

            thisComp.workAreaStart = inTime;
            thisComp.workAreaDuration = newDur;
 
            app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));
        }
        
        if (preserveCompStart = true){
            thisComp.displayStartTime = oldDispStartTime;
        }
    }

    // zl_TrimCompToContents_getInTime()
    // 
    // Description:
    // This function gets the earliest inPoint for target layers
    // 
    // Parameters:
    // targetLayers - array of layers to analyze
    // 
    // Returns:
    // inPoint of earliest layer
    //
    function zl_TrimCompToContents_getInTime(targetLayers){
        var layerIndex = 0;

        for (i = 0; i <= targetLayers.length-1; i++)
            if (targetLayers[i].inPoint < targetLayers[layerIndex].inPoint)
                layerIndex = i;
    
        return targetLayers[layerIndex].inPoint;
    }

    // zl_TrimCompToContents_getOutTime()
    // 
    // Description:
    // This function gets the latest outPoint for target layers
    // 
    // Parameters:
    // targetLayers - array of layers to analyze
    // 
    // Returns:
    // outPoint of earliest layer
    //
    function zl_TrimCompToContents_getOutTime(targetLayers){
        var layerIndex = 0;
        
        for (i = 0; i <= targetLayers.length-1; i++)
            if (targetLayers[i].outPoint > targetLayers[layerIndex].outPoint)
                layerIndex = i;

        return targetLayers[layerIndex].outPoint;
    }

    // zl_TrimCompToContents_shiftLayers()
    // 
    // Description:
    // Shift all target layers forward in time to get out of negative inPoint
    // 
    // Parameters:
    // targetLayers - array of layers to analyze
    // inTime - Amount of time to shift layers
    // 
    // Returns:
    // Nothing.
    //
    function zl_TrimCompToContents_shiftLayers(targetLayers, inTime, skipLocked){

        for (i = 0; i <= targetLayers.length-1; i++)
            targetLayers[i].startTime = targetLayers[i].startTime + Math.abs(inTime);
    }

    // Main operations! Oh yeah. Let's go.
    app.beginUndoGroup("zl_TrimCompToContents");
        zl_TrimCompToContents(this);
    app.endUndoGroup();
}