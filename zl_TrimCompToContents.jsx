{
    // zl_TrimCompToContents
    // Copyright (c) 2013 Zack Lovatt. All rights reserved.
    // zacklovatt.com
    //
    // Name: zl_TrimCompToContents
    // Version: 0.1
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

        if (layerCount == 0){
            alert ("No layers detected!");
        } else {       
            var inTime = zl_TrimCompToContents_getInTime(thisComp, layerCount);
            var outTime = zl_TrimCompToContents_getOutTime(thisComp, layerCount);

            if (inTime < thisComp.displayStartTime){
                    zl_TrimCompToContents_shiftLayers(thisComp, layerCount, inTime);
                    inTime = zl_TrimCompToContents_getInTime(thisComp, layerCount);
                    outTime = zl_TrimCompToContents_getOutTime(thisComp, layerCount)
            }
        
            var newDur = outTime - inTime;

            if (thisComp.duration < outTime){
                thisComp.duration = newDur + inTime + 1;
            }

            thisComp.workAreaStart = inTime;
            thisComp.workAreaDuration = newDur;
 
            app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));
        }
        
    }

    // zl_TrimCompToContents_getInTime()
    // 
    // Description:
    // This function gets the In Time for the comp contents
    // 
    // Parameters:
    // curComp - Target comp
    // layerCount - # of layers in comp
    // 
    // Returns:
    // In time of earliest layer in comp.
    //
    function zl_TrimCompToContents_getInTime(curComp, layerCount){
        var layerIndex = 1;
        
        for (i = 1; i <= layerCount; i++){
            if (curComp.layer(i).inPoint < curComp.layer(layerIndex).inPoint){
                layerIndex = i;
            }
        }
    
        return curComp.layer(layerIndex).inPoint;
    }

    // zl_TrimCompToContents_getOutTime()
    // 
    // Description:
    // This function gets the Out Time for the comp contents
    // 
    // Parameters:
    // curComp - Target comp
    // layerCount - # of layers in comp
    // 
    // Returns:
    // Out time of latest layer in comp.
    //
    function zl_TrimCompToContents_getOutTime(curComp, layerCount){
        var layerIndex = 1;
        
        for (i = 1; i <= layerCount; i++){
            if (curComp.layer(i).outPoint > curComp.layer(layerIndex).outPoint){
                layerIndex = i;
            }
        }
    
        return curComp.layer(layerIndex).outPoint;
    }

    // zl_TrimCompToContents_shiftLayers()
    // 
    // Description:
    // Shift all layers forward in time so all start early 
    // 
    // Parameters:
    // curComp - Target comp
    // layerCount - # of layers in comp
    // inTime - Amount of time to shift layers
    // 
    // Returns:
    // Nothing.
    //
    function zl_TrimCompToContents_shiftLayers(curComp, layerCount, inTime){
        for (i = 1; i <= layerCount; i++){
            var oldOutPt = curComp.layer(i).outPoint;
            curComp.layer(i).inPoint = curComp.layer(i).inPoint + Math.abs(inTime);
            curComp.layer(i).outPoint = oldOutPt + Math.abs(inTime);
        }
    }

    app.beginUndoGroup("zl_TrimCompToContents");
        zl_TrimCompToContents(this);
    app.endUndoGroup();
}