function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

function rot47(x) {
    var s=[];
    for(var i=0;i<x.length;i++) {
        var j=x.charCodeAt(i);
        if ((j>=33)&&(j<=126)) {
            s[i]=String.fromCharCode(33+((j+ 14)%94));
        } else {
            s[i]=String.fromCharCode(j);
        }
    }
    return s.join('');
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function appendRepeatItem(parent, repeatCount, repeatType) {
    var repeatLineP = document.createElement('p');
    repeatLineP.setAttribute('class', repeatType + ' logitem');
    var repeatLineText = document.createTextNode('--- Same logline was repeated ' + repeatCount + ' more time(s)');
    repeatLineP.appendChild(repeatLineText);
    parent.appendChild(repeatLineP);
}

function parseXpiksLogs(parent, text, decode) {
    var lines = text.split("\n");
    var threads_colors = ['#00897b', '#d32f2f', '#ad1457', '#7b1fa2', '#5e35b1', '#3f51b5', '#039be5', '#0097a7', '#388e3c', '#afb42b', '#fbc02d', '#8d6e63', '#f48fb1', '#4a148c', '#880e4f', '#b71c1c', '#0d47a1', '#004d40', '#006064'];
    shuffle(threads_colors);

    var usedThreads = {};
    var lastUsedThreads = 0;
    var lastLogLine = '';
    var sameLogLinesCount = 0;
    var lastLogType = '';

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (decode) { line = rot47(line); }
        var parts = line.split(' ');

        if ((parts.length < 3) || (!strStartsWith(parts[2], 'T#'))) {
            var rawLine = document.createTextNode(line);
            parent.appendChild(rawLine);
            continue;
        }

        var logLine = parts.slice(3).join(' ');
        if (logLine != lastLogLine) {
            if (sameLogLinesCount > 0) {
                appendRepeatItem(parent, sameLogLinesCount, lastLogType);
            }

            lastLogLine = logLine;
            lastLogType = parts[1];
            sameLogLinesCount = 0;
        } else {
            sameLogLinesCount++;
            continue;
        }

        var element = document.createElement('p');
        element.setAttribute('class', parts[1] + ' logitem');

        var time = document.createTextNode(parts[0] + ' ');
        element.appendChild(time);

        var threadIDElement = document.createElement('span');
        var threadColor = '';
        var threadID = parts[2];
        if (usedThreads.hasOwnProperty(threadID)) {
            threadColor = usedThreads[threadID];
        } else {
            threadColor = threads_colors[lastUsedThreads];
            usedThreads[threadID] = threadColor;
            lastUsedThreads = (lastUsedThreads + 1) % threads_colors.length;
        }

        threadIDElement.setAttribute('style', 'color: ' + threadColor);
        threadIDElement.innerHTML = threadID;
        element.appendChild(threadIDElement);

        var logTextElement = document.createElement('span');

        logTextElement.innerHTML = ' ' + logLine;
        element.appendChild(logTextElement);

        parent.appendChild(element);
    }
}

function clearPreviousEntries(element) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
}

function prepareAndPublishLogs(text) {
    var textDisplayArea = document.getElementById('textDisplayArea');
    clearPreviousEntries(textDisplayArea);
    var decode = document.getElementById("decryptCheckbox").checked;
    parseXpiksLogs(textDisplayArea, text, decode);
    textDisplayArea.style.visibility = "visible";
    $(".brd").css({"visibility" : "visible"});
}

function readAndPublish(file) {
    var label = document.getElementById('inputlabel');

    var reader = new FileReader();
    reader.onload = function(e) {
        var text = reader.result;
        prepareAndPublishLogs(text);
        label.querySelector('span').innerHTML = 'File: ' + file.name;
    };

    reader.readAsText(file);
}

function handleDragDrop(event) {
    event.stopPropagation();
    event.preventDefault();

    var files = event.dataTransfer.files;

    if (files && files.length > 0) {
        var f = event.dataTransfer.files[0];
        readAndPublish(f);
    } else {
        var text = event.dataTransfer.getData('text');
        prepareAndPublishLogs(text);
    }

    $('.upload-cont').css('border', '');
}

function openFileDialogHandler(event) {
    if (event.target.files &&
        event.target.files.length) {
        var f = event.target.files[0];
        readAndPublish(f);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    $(".upload-cont").css({"border":"thick dashed white"});
}

function filterLogs() {
    var filterText = document.getElementById('filterText').value.trim();

    var logs = document.querySelectorAll(".logitem");
    for (var i = 0; i < logs.length; i++) {
        var logItem = logs[i];
        if (filterText == '' || logItem.innerHTML.includes(filterText)) {
            logItem.style.visibility = 'visible';
            logItem.style.display = 'block';
        } else {
            logItem.style.visibility = 'hidden';
            logItem.style.display = 'none';
        }
    }
}

function resetFiltering() {
    document.getElementById('filterText').value = '';
    filterLogs();
}

function loadLogFromJsFile() {
    if (typeof logsVariable !== "undefined") {
        var text = logsVariable;
        prepareAndPublishLogs(text);

        $(".debug, .info").css({
            "visibility" : "hidden",
            "display" : "none"
        });
    }
}

window.onload = function() {
    loadScript('current-log.js', loadLogFromJsFile);

    var fileInput = document.getElementById('files');
    var dropZone = document.getElementById('box');

    fileInput.addEventListener('change', openFileDialogHandler);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDragDrop);

    var filterText = document.getElementById('filterText');

    $(filterText).on("paste", function(e) {
        e.preventDefault();
        e.stopPropagation();
        var text = e.originalEvent.clipboardData.getData('text');
        filterText.value = text;
        filterLogs();
    });

    $(document).on("paste", function (e) {
        e.preventDefault();
        e.stopPropagation();
        // Short pause to wait for paste to complete
        var text = e.originalEvent.clipboardData.getData('text');
        prepareAndPublishLogs(text);
    });
};

