const { remote, ipcRenderer, shell } = require('electron')
const {dialog, Menu, MenuItem,} = remote
const fs = require('fs')

const API_URL = remote.getGlobal("API_URL")
const keytar = require('keytar')
const mtga = require('mtga')
const path = require('path')
const os = require('os')

let desktopPath = path.join(os.homedir(), 'Desktop')

const tt = require('electron-tooltip')
tt({
  position: 'top',
  style: {
    backgroundColor: 'dark gray',
    color: 'white',
    borderRadius: '4px',
  }
})

var settingsData = {
  version: remote.getGlobal("version"),
  commit: "",
  build: "",
  logPath: remote.getGlobal("logPath"),
  version: remote.getGlobal("version"),
  mtgaOverlayOnly: remote.getGlobal("mtgaOverlayOnly"),
  settingsPaneIndex: "about",
  debug: remote.getGlobal('debug'),
  showErrors: remote.getGlobal('showErrors'),
  showInspector: remote.getGlobal('showInspector'),
  incognito: remote.getGlobal('incognito'),
  useFrame: remote.getGlobal('useFrame'),
  staticMode: remote.getGlobal('staticMode'),
  useTheme: remote.getGlobal('useTheme'),
  themeFile: remote.getGlobal('themeFile'),
  mouseEvents: remote.getGlobal('mouseEvents'),
  leftMouseEvents: remote.getGlobal('leftMouseEvents'),
  showTotalWinLossCounter: remote.getGlobal('showTotalWinLossCounter'),
  showDeckWinLossCounter: remote.getGlobal('showDeckWinLossCounter'),
  winLossObj: remote.getGlobal('winLossCounter'),
  counterDeckList: [],
  totalWinLossCounter: null,
  lastCollection: remote.getGlobal('lastCollection'),
  lastVaultProgress: remote.getGlobal('lastVaultProgress'),
  showVaultProgress: remote.getGlobal('showVaultProgress'),
  minVaultProgress: remote.getGlobal('minVaultProgress'),
  showGameTimer: remote.getGlobal('showGameTimer'),
  showChessTimers: remote.getGlobal('showChessTimers'),
  hideDelay: remote.getGlobal('hideDelay'),
  invertHideMode: remote.getGlobal('invertHideMode'),
  rollupMode: remote.getGlobal('rollupMode'),
  recentCards: remote.getGlobal('recentCards'),
  recentCardsQuantityToShow: remote.getGlobal('recentCardsQuantityToShow'),
  runFromSource: remote.getGlobal('runFromSource'),
  sortMethodSelected: remote.getGlobal('sortMethod'),
  useFlat: remote.getGlobal('useFlat'),
  useMinimal: remote.getGlobal('useMinimal'),
  updateDownloading: remote.getGlobal('updateDownloading'),
  updateReady: remote.getGlobal('updateReady'),
  firstRun: remote.getGlobal('firstRun'),
  trackerID: remote.getGlobal('trackerID'),
  customStyleFiles: [],
  sortingMethods: [
    {id: "draw", text: "By likelihood of next draw (default)",
    help: "This method shows cards in order from most likely to draw on top of the list to least likely to draw on the bottom, with no other considerations."},
    {id: "emerald", text: '"Emerald" method',
    help: "This method sorts cards by card type, then by cost, then by name."}
  ],
}
settingsData.counterDeckList = counterDecks();
settingsData.totalWinLossCounter = settingsData.winLossObj.total;
let commitFile = "version_commit.txt"
let buildFile = "version_build.txt"

if (!settingsData.runFromSource) {
  commitFile = path.join(remote.app.getAppPath(), commitFile)
  buildFile = path.join(remote.app.getAppPath(), buildFile)
}

fs.readFile(commitFile, "utf8", (err, data) => {
  settingsData.commit = data;
})

fs.readFile(buildFile, "utf8", (err, data) => {
  settingsData.build = data;
})

const menu = new Menu()
const menuItem = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  }
})
menu.append(menuItem)

if (settingsData.debug) {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    rightClickPosition = {x: e.x, y: e.y}
    menu.popup(remote.getCurrentWindow())
  }, false)
}

ipcRenderer.on('counterChanged', (e,new_wlc) => {
console.log(new_wlc)  ;
  settingsData.winLossObj = new_wlc;
  settingsData.counterDeckList = counterDecks();
  settingsData.totalWinLossCounter = settingsData.winLossObj.total;
});

/*
 * Format decks in winLossCounter to array for display in rivets.
 */
function counterDecks(){
  let decks = [];
  let ids = Object.keys(settingsData.winLossObj);
  for (let x=0;x<ids.length;x++){
    if (ids[x] == 'total' || ids[x] == 'win' || ids[x] == 'loss') {
      continue;
    }
    decks.push({'id':ids[x],'name': settingsData.winLossObj[ids[x]]['name'], 'win':settingsData.winLossObj[ids[x]]['win'],'loss':settingsData.winLossObj[ids[x]]['loss']});
  }
  return decks.sort((a,b) => {
    if ( a.name < b.name ){
      return -1;
    } else if ( a.name == b.name ) {
      return 0;
    } else {
      return 1;
    }
  } );
}

rivets.formatters.countcollection = function(collection) {
    let total = 0;
    let unique = 0;
    for (let key in collection) {
      if (collection[key] && Number.isInteger(collection[key])) {
        total += collection[key]
        unique += 1
      }
    }
    return `${unique} unique cards, ${total} total cards`
};

rivets.formatters.and = function(comparee, comparator) {
    return comparee && comparator;
};

rivets.formatters.andnot = function(comparee, comparator) {
    return comparee && !comparator;
};

rivets.formatters.short = function(val) {
  if (val) {
    return val.substring(0, 6)
  }
}

rivets.formatters.filterBySlideValueRecentCards = function(arr, recentCardsQuantityToShow) {
  if(recentCardsQuantityToShow >= 100) {
    return arr;
  }
  return arr.slice(0,recentCardsQuantityToShow);
}

rivets.binders.ghlink = (el, val) => {
   el.href = `https://github.com/mtgatracker/mtgatracker/commit/${val}`
}

rivets.binders.appveyorlink = (el, val) => {
   el.href = `https://ci.appveyor.com/project/shawkinsl/mtgatracker/builds/${val}`
}

rivets.binders.settingspaneactive = (el, val) => {
  console.log("active")
  el.classList.remove("active")
  if (el.attributes.value.value == val) {
    el.classList.add("active")
  }
}

rivets.binders.showsettingspane = (el, val) => {
  el.style.display = "none"
  if (el.attributes.value.value == val) {
    el.style.display = "block"
    $(el).find(".toggle").each(function(idx, e) {e.style.width="65px"; e.style.height="40px";})  // bad dumb hack for buttons
  }
}

rivets.binders.authcolor = (el, val) => {
  el.style.color = val ? "green" : "red";
}

rivets.binders.datatooltip = (el, val) => {
  if (val) {
    el.setAttribute('data-tooltip', 'Account is authorized!');
  } else {
    el.setAttribute('data-tooltip', 'Account not authorized :(');
  }
}

rivets.binders.authref = (el, val) => {
  el.href = "https://inspector.mtgatracker.com/trackerAuth?code=" + val
}

rivets.binders.recentcardsbinder = (el, cardsObtained) => {
  var node;
  var textNode;
  var currentCard
  for(var cardID in cardsObtained) {
    currentCard = mtga.allCards.findCard(cardID)
    if(currentCard) {
      textNode = document.createTextNode(`${cardsObtained[cardID]}x ${currentCard.attributes.prettyName}`);
    } else {
      textNode = document.createTextNode(`${cardsObtained[cardID]}x card-name-not-found (${cardID})`);
    }
    node = document.createElement("li");
    node.style.webkitUserSelect = "auto";
    node.appendChild(textNode);
    el.appendChild(node);
  }
  if(Object.keys(cardsObtained).length > 0) {
    document.getElementById("no-recently-obtained-cards").style.display = "none";
  }
}

rivets.binders.deckid = function(el, value) {
  el.id = value + '-reset-button';
  el.setAttribute('data-deckid', value);
}

function recentCardsSectionClickHandler(event) {
  var revealed = $(event.target).siblings(".recent-cards-container").is(":hidden");
  if(revealed) {
    $(event.target).siblings(".recent-cards-container").slideDown("fast");
  } else {
    $(event.target).siblings(".recent-cards-container").slideUp("fast");
  }
}


document.addEventListener("DOMContentLoaded", function(event) {
  rivets.bind(document.getElementById('container'), settingsData)

  let themePath = settingsData.runFromSource ? "themes" : path.join("..", "themes");
  fs.readdir(themePath, (err, files) => {
    if(files) {
      files.forEach((val) => {
        if (val.endsWith(".css")) {
          settingsData.customStyleFiles.push(val)
        }
      })
    }
    $("#custom-theme-select").val(settingsData.themeFile)
  })

  $("#showTrackerID").on('click', function(event) {
    this.innerHTML = settingsData.trackerID;
  })
  $("#log-select").click(function() {
    dialog.showOpenDialog({
      properties: ["openFile"],
      defaultPath: remote.getGlobal("logPath")
    }, filePath => {
      if (filePath) {
        console.log(`next launch will read from ${filePath}`)
        settingsData.logPath = filePath
        ipcRenderer.send('settingsChanged', {key: "logPath", value: filePath[0]})
        alert("You must restart MTGATracker after changing this setting!")
      }
    })
  })
  $("#sorting-method-select").val(settingsData.sortMethodSelected)
  $(document).on('click', 'a[href^="http"]', function(event) {
      event.preventDefault();
      shell.openExternal(this.href);
  });
  $(".nav-group-item").click((e) => {
    console.log(e)
    console.log(this)
    settingsData.settingsPaneIndex = e.target.attributes.value.value
  })
  $('.tf-toggle').change(function() {
    console.log("settingsChanged")
    ipcRenderer.send('settingsChanged', {key: $(this).attr("key"), value: $(this).prop('checked')})
  })
  $('#apply-custom-theme-toggle').change(function() {
    console.log("apply theme was just toggled")
    settingsData.useTheme = $(this).prop('checked')
    let themeSelected = $("#custom-theme-select").val()
    ipcRenderer.send('settingsChanged', {key: "useTheme", value: settingsData.useTheme})
    ipcRenderer.send('settingsChanged', {key: "themeFile", value: themeSelected})
  })
  $('#enable-flat-theme-toggle').change(function() {
    console.log("apply flat theme was just toggled")
    settingsData.useFlat = $(this).prop('checked')
    ipcRenderer.send('settingsChanged', {key: "useFlat", value: settingsData.useFlat})
    if (!settingsData.useFlat) {
      settingsData.useMinimal = false;
      ipcRenderer.send('settingsChanged', {key: "useMinimal", value: settingsData.useMinimal})
    }
  })
  $('#enable-minimal-theme-toggle').change(function() {
    console.log("apply theme was just toggled")
    settingsData.useMinimal = $(this).prop('checked')
    ipcRenderer.send('settingsChanged', {key: "useMinimal", value: settingsData.useMinimal})
  })
  $("#custom-theme-select").change(function() {
    console.log("apply theme was just toggled")
    let themeSelected = $("#custom-theme-select").val()
    ipcRenderer.send('settingsChanged', {key: "useTheme", value: settingsData.useTheme})
    ipcRenderer.send('settingsChanged', {key: "themeFile", value: themeSelected})
  })
  $("#sorting-method-select").change(function() {
    console.log("sorting method was just chosen")
    let sortMethodSelected = $("#sorting-method-select").val()
    ipcRenderer.send('settingsChanged', {key: "sortMethod", value: sortMethodSelected})
  })
  $(".reset-button").click((e) => {
    let deck_id = e.target.getAttribute('data-deckid');

    let message = "Are you sure you want to reset (delete) ";
    if (deck_id == 'all'){
      message += 'all win/loss counters?';
    } else if (deck_id == 'all-decks' ){
      message += 'all deck win/loss counters?'
    } else if (deck_id == 'total'){
      message += 'the total win/loss counter?'
    } else {
      message += 'the ' + settingsData.winLossObj[deck_id].name + ' win/loss counter?';
    }
    if (!dialog.showMessageBox(remote.getCurrentWindow(), {'buttons': ['Cancel','Ok'],'message':message,})){
      return;
    }

    console.log("resetting win/loss");
    let new_wlc = {};

    if (deck_id == 'all') {
      new_wlc = {'total':{'win':0,'loss':0}};
    } else if (deck_id == 'all-decks') {
      new_wlc.total = settingsData.winLossObj.total;
    } else if (deck_id == 'total'){
      new_wlc = settingsData.winLossObj;
      new_wlc.total = {'win':0,'loss':0};
    } else {
      new_wlc = settingsData.winLossObj;
      new_wlc[deck_id] = undefined;
      new_wlc = JSON.parse(JSON.stringify(new_wlc));
    }
    ipcRenderer.send('updateWinLossCounter', {key: 'all', value: new_wlc})
  })
  $("#resetGameHistory").click((e) => {
    console.log("resetting gameHstory")
    ipcRenderer.send('clearGameHistory')
  })
  $("#exportCollectionMTGGButton").click((e) => {
    console.log("exporting mtgg to desktop")
    let allPromises = []
    for (let cardKey in settingsData.lastCollection) {
      allPromises.push(mtga.allCards.findCard(cardKey))
    }

    Promise.all(allPromises).then(allCards => {
      let mtggExportPath = path.join(desktopPath, 'mtga_collection_mtggoldfish.csv')
      let csvContents = "Name,Edition,Qty,Foil\n"
      for (let card of allCards) {
        if (card) {
          let mtgaID = card.get("mtgaID")
          let prettyName = card.get("prettyName")
          let set = card.get("set")
          if (set == "DAR") set = "DOM"  // sigh, c'mon arena devs
          let count = settingsData.lastCollection[mtgaID]
          csvContents +=`"${prettyName}",${set},${count},No\n`
        }
      }
      fs.writeFile(mtggExportPath, csvContents, (err) => {
        if (err) {
          alert(`error saving export: ${err}`)
        } else {
          alert(`Saved to ${mtggExportPath} !`)
        }
      })
    })
  })

  document.getElementById("hide-delay").value = "" + settingsData.hideDelay;
  let initialValue = settingsData.hideDelay
  if (initialValue == 100) initialValue = "∞"
  $(".slidevalue").html(initialValue)
  document.getElementById("hide-delay").onchange = function() {
    let value = parseInt(this.value)
    ipcRenderer.send('settingsChanged', {key: "hideDelay", value: value})
  }
  document.getElementById("hide-delay").oninput = function() {
    let value = this.value
    if(value == 100) {
      value = "∞"
    }
    $(".slidevalue").html(value)
  }

  document.getElementById("min-vault-progress").value = "" + settingsData.minVaultProgress;
  let initialValueVault = settingsData.minVaultProgress;

  $(".slidevalue-vault").html(initialValueVault)
  document.getElementById("min-vault-progress").onchange = function() {
    let value = parseInt(this.value)
    ipcRenderer.send('settingsChanged', {key: "minVaultProgress", value: value})
  }
  document.getElementById("min-vault-progress").oninput = function() {
    let value = this.value
    $(".slidevalue-vault").html(value)
  }

  document.getElementById("recent-cards-quantity-slider").value = "" + settingsData.recentCardsQuantityToShow;
  let initialValueRecentCardsQuantityToShow = settingsData.recentCardsQuantityToShow;
  if(initialValueRecentCardsQuantityToShow == 100) {
    initialValueRecentCardsQuantityToShow = "∞"
  }
  $(".slidevalue-recent-cards").html(initialValueRecentCardsQuantityToShow)
  document.getElementById("recent-cards-quantity-slider").onchange = function() {
    let value = parseInt(this.value)
    settingsData.recentCardsQuantityToShow = value;
    ipcRenderer.send('settingsChanged', {key: "recentCardsQuantityToShow", value: value})
  }
  document.getElementById("recent-cards-quantity-slider").oninput = function() {
    let value = this.value
    settingsData.recentCardsQuantityToShow = value;
    if(value == 100) {
      value = "∞"
    }
    $(".slidevalue-recent-cards").html(value);
  }
})

// ipcRenderer.send('settingsChanged', {cool: true})
