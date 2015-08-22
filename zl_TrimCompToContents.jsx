/**********************************************************************************************
    zl_TrimCompToContents
    Copyright (c) 2013 Zack Lovatt. All rights reserved.
    zack@zacklovatt.com

    Name: zl_TrimCompToContents
    Version: 1.4

    Description:
        This script trims or lengthens your current comp to the in & out
        points of its contents.

        Originally requested by Alan Fregtman (darkvertex.com)

        This script is provided "as is," without warranty of any kind, expressed
        or implied. In no event shall the author be held liable for any damages
        arising in any way from the use of this script.

**********************************************************************************************/

function zl_TCC (thisObj) {

    var zl_TCC__scriptName = "zl_TrimCompToContents";

    /******************************
        zl_TrimComptoContents ()

        Description:
        This function contains the main logic for this script.

        Parameters:
        thisComp - target comp
        recurse - whether to crop precomps
        useAll - use all layers (vs selected)
        ignoreLocked - ignore locked layers
        preserveStart - preserve start time

        Returns:
        Nothing.
    ******************************/
    function zl_TrimComptoContents (thisComp, recurse, useAll, ignoreLocked, preserveStart){

        var layerCount = thisComp.numLayers;
        var userLayers = thisComp.selectedLayers;
        var lockedLayers = [];

        // Find the current start time, set it to 0, set it back at the end if the switch is thrown
        var oldDispStart = timeToCurrentFormat(thisComp.displayStartTime, thisComp.frameRate, 0);
        thisComp.displayStartTime = 0;

        // Recurse!
        if (recurse == true)
        	for (var i = 1, il = layerCount; i <= il; i++) {
	        	var thisLayer = thisComp.layers[i];
        		if (thisLayer.source instanceof CompItem){
	        		thisLayer.source.openInViewer();
        			zl_TrimComptoContents(thisLayer.source, recurse, useAll, ignoreLocked, preserveStart);
        			thisComp.openInViewer();
        		}
        	}

        // Build our layer array based on either all layers or unlocked-only layers
        // Also build an array of locked layers, and unlock them. Will relock later.
        if (useAll == true){
            for (var i = 0, il = thisComp.layers.length-1; i <= il; i++){
            	var curLayer = thisComp.layers[i+1];
                if (ignoreLocked == true && curLayer.locked == false){
                    userLayers.push(curLayer);
                } else if (ignoreLocked == false){
                    userLayers[i] = curLayer;
                    if (curLayer.locked == true){
                        curLayer.locked = false;
                        lockedLayers.push(curLayer);
                    }
                }
            }
        }

        // Error messages for either no layers selected / no layers detected
        // Otherwise, head on in and let's make some magic.
        if ((useAll == true) && (userLayers.length == 0)){
            alert ("No layers detected!");
        } else if ((useAll == false) && (userLayers.length == 0)){
            alert ("No layers selected!");
            preserveStart = true;
        } else {
            var inTime = zl_TCC_getInTime(userLayers);
            var outTime = zl_TCC_getOutTime(userLayers);

            // If the earliest layer is before comp start, shift everything down
            if (inTime < thisComp.displayStartTime){
                    zl_TCC_shiftLayers(userLayers, inTime, thisComp);
                    inTime = 0; //zl_TCC_getInTime(userLayers);
                    outTime = zl_TCC_getOutTime(userLayers);
            }

            var newDur = outTime - inTime;

            // These correct for any issues dealing with floating point & fractional framerates
            if (newDur < thisComp.frameDuration)
                newDur = thisComp.frameDuration;
            if  ((inTime + newDur) > thisComp.duration)
                thisComp.duration += 1;
            if (thisComp.duration < outTime){
                thisComp.duration = newDur + inTime + 1;
            }

            // Set work area & trim!
            thisComp.workAreaStart = inTime;
            thisComp.workAreaDuration = newDur;

            app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));
            app.executeCommand(2360);

            // Re-lock those locked layers
            if (ignoreLocked == false)
                for (var i = 0, il = lockedLayers.length; i < il; i++)
                    lockedLayers[i].locked = true;
        }

        // Check for preserve toggle, set it back.
        if (preserveStart == true){
            thisComp.displayStartTime = currentFormatToTime(oldDispStart, thisComp.frameRate, 0) + 0.0001;
        } else {
            thisComp.displayStartTime = 0;
        }
    } // end function TrimCompToContents


    /******************************
        zl_TCC_getInTime()

        Description:
        This function gets the earliest inPoint for target layers

        Parameters:
        targetLayers - array of layers to analyze

        Returns:
        inPoint of earliest layer
     ******************************/
    function zl_TCC_getInTime(targetLayers){
        var layerIndex = 0;

        for (var i = 0, il = targetLayers.length-1; i <= il; i++)
            if (targetLayers[i].inPoint < targetLayers[layerIndex].inPoint)
                layerIndex = i;

        return targetLayers[layerIndex].inPoint;
    } // end function getInTime


    /******************************
        zl_TCC_getOutTime()

        Description:
        This function gets the earliest outPoint for target layers

        Parameters:
        targetLayers - array of layers to analyze

        Returns:
        outPoint of latest layer
     ******************************/
    function zl_TCC_getOutTime(targetLayers){
        var layerIndex = 0;

        for (var i = 0, il = targetLayers.length-1; i <= il; i++)
            if (targetLayers[i].outPoint > targetLayers[layerIndex].outPoint)
                layerIndex = i;

        return targetLayers[layerIndex].outPoint;
    } // end function getOutTime


    /******************************
        zl_TCC_shiftLayers()

        Description:
        Shift all target layers forward in time to get out of negative inPoint

        Parameters:
        targetLayers - array of layers to analyze
        inTime - Amount of time to shift layers
        compFPS - Frame rate of comp

        Returns:
        Nothing
     ******************************/
    function zl_TCC_shiftLayers (targetLayers, inTime, thisComp){
        var compFPS = 1/thisComp.frameDuration;
        var shiftFrames = Math.abs(inTime)*compFPS;
        var startTimeFrames = 0;
        var totalFrames = 0;

        for (var i = 0, il = targetLayers.length-1; i <= il; i++){
            startTimeFrames = targetLayers[i].startTime*compFPS;
            totalFrames = startTimeFrames + shiftFrames;

            targetLayers[i].startTime = totalFrames/compFPS;
        }
    } // end function shiftLayers


    /******************************
        zl_TCC_createPalette()

        Description:
        Creates ScriptUI Palette Panel
        Generated using Boethos (crgreen.com/boethos)

        Parameters:
        thisObj - this comp object

        Returns:
        Nothing
     ******************************/
    function zl_TCC_createPalette (thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', zl_TCC__scriptName, undefined);
        var useAll = true;
        var ignoreLocked = false;
        var preserveStart = false;
        var recurse = true;

        { // Buttons
            win.trimSelectedButton = win.add('button', undefined, 'Trim Comp');
            win.trimSelectedButton.alignment = "fill";

            win.trimSelectedButton.onClick = function () {
                if (app.project) {
                    var thisComp = app.project.activeItem;

                    if (thisComp != null && (thisComp instanceof CompItem)) {
                        app.beginUndoGroup(zl_TCC__scriptName);
                        zl_TrimComptoContents(thisComp, recurse, useAll, ignoreLocked, preserveStart);
                        app.endUndoGroup();
                    } else {
                        alert("Select an active comp!", zl_TCC__scriptName);
                    }
                } else {
                    alert("Open a project!", zl_TCC__scriptName);
                }
            }
        }

        { // Options
            win.optionGroup = win.add('panel', undefined, 'Options', {borderStyle: "etched"});
            win.optionGroup.alignChildren = "left";

            { // Trim To All
                win.optionGroup.trimToAll = win.optionGroup.add('checkbox', undefined, 'Trim To All');
                win.optionGroup.trimToAll.value = true;
                win.optionGroup.trimToAll.onClick = function(){
                    useAll = this.value;
                    win.optionGroup.ignoreLockedCheckbox.enabled =this.value;
                }
            }

            { // Ignore Locked
                win.optionGroup.ignoreLockedCheckbox = win.optionGroup.add('checkbox', undefined, 'Ignore Locked Layers');
                win.optionGroup.ignoreLockedCheckbox.value = false;
                win.optionGroup.ignoreLockedCheckbox.onClick = function(){
                    ignoreLocked = this.value;
                }
            }

            { // Recurse
                win.optionGroup.recurse = win.optionGroup.add('checkbox', undefined, 'Crop Nested Comps');
                win.optionGroup.recurse.value = true;
                win.optionGroup.recurse.onClick = function(){
                    recurse = this.value;
                }
            }

            { // Preserve Start
                win.optionGroup.preserveStartCheckbox = win.optionGroup.add('checkbox', undefined, 'Preserve Comp Start Time');
                win.optionGroup.preserveStartCheckbox.value = false;
                win.optionGroup.preserveStartCheckbox.onClick = function(){
                    preserveStart = this.value;
                }
            }
        }

        return win;
    } // end function createPalette


    /******************************
        zl_TCC_main()

        Description:
        Main function

        Parameters:
        thisObj - this comp object

        Returns:
        Nothing
     ******************************/
    function zl_TCC_main(thisObj) {

        var myPalette = zl_TCC_createPalette(thisObj);

        if (myPalette != null){
            if (myPalette instanceof Window){

		        var useAll = true;
		        var ignoreLocked = false;
		        var preserveStart = false;
        		var recurse = true;

		        if (ScriptUI.environment.keyboardState.altKey)
		            useAll = false;

		        if (ScriptUI.environment.keyboardState.shiftKey)
		            ignoreLocked = true;

		        if ((ScriptUI.environment.keyboardState.ctrlKey) || (ScriptUI.environment.keyboardState.metaKey))
		            preserveStart = true;

                if (app.project) {
                    var thisComp = app.project.activeItem;

                    if (thisComp != null && (thisComp instanceof CompItem)) {
                        app.beginUndoGroup(zl_TCC__scriptName);
                        zl_TrimComptoContents(thisComp, recurse, useAll, ignoreLocked, preserveStart);
                        app.endUndoGroup();
					} else {
                        alert("Select an active comp!", zl_TCC__scriptName);
                    }
                } else {
                    alert("Open a project!", zl_TCC__scriptName);
                }
            } else {
                myPalette.layout.layout(true);
            }
        }
    } // end function main

    // RUN!
    zl_TCC_main(this); // <= This brings up the panel

} // end zl_TCC

zl_TCC(this);