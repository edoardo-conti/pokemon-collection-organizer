const setCheckboxesContainer = document.getElementById('setCheckboxes');
const loadButton = document.getElementById('loadButton');
const cardTable = document.getElementById('cardTable');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const firstPageButton = document.getElementById('firstPageButton');
const lastPageButton = document.getElementById('lastPageButton');
const duplicatePokedexList = document.getElementById('duplicatePokedexList');
const sameSetConflictList = document.getElementById('sameSetConflictList');
const globalConflictList = document.getElementById('globalConflictList');
const sortMethodSelect = document.getElementById('sortMethod');
const sortButton = document.getElementById('sortButton');
const duplicatePokedexContainer = document.getElementById('duplicatePokedexContainer');
const manualModeButton = document.getElementById('manualModeButton');
const mmDesktop = document.getElementById('desktop');
const trashDesktopButton = document.getElementById('trashDesktop');

let selectedSets = [];
let allSelectedCards = [];
let displayedCardsIndex = 0;
let selectedSetsNames = [];

let currentPage = 1; // Pagina attualmente visualizzata
const cardsPerPage = 9; // Numero di carte per pagina

const loadingIcon = document.createElement('span');
loadingIcon.className = 'loading-icon';

const debugMode = false;

let manualModeEnabled = false;
let draggedCardIndex = null;
let draggedCardLocation = null;
let draggedCardZone = null;
let draggableCards = [];

let cardsOnPage = false;

let allCardsInDesktop = [];

function simulateClick(element) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  element.dispatchEvent(event);
}

function updateSelectedSets(setId) {
  if (selectedSets.includes(setId)) {
    selectedSets = selectedSets.filter(id => id !== setId);
  } else {
    selectedSets.push(setId);
  }
}

async function fetchSets() {
  // Ottieni il riferimento al container dei checkbox dei set
  //const setCheckboxesContainer = document.getElementById('setCheckboxesContainer');

  // Crea l'elemento dell'icona di caricamento e aggiungilo al container
  const loadingIcon = document.createElement('div');
  loadingIcon.classList.add('loading-icon'); // Assicurati che la classe 'loading-icon' abbia uno stile CSS appropriato
  setCheckboxesContainer.appendChild(loadingIcon);

  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets');
    const data = await response.json();
    const sets = data.data;
  
    sets.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  
    sets.forEach(set => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = set.id;
      checkbox.addEventListener('change', () => updateSelectedSets(set.id));
    
      const label = document.createElement('label');
      label.textContent = set.name;
    
      setCheckboxesContainer.appendChild(checkbox);
      setCheckboxesContainer.appendChild(label);
      setCheckboxesContainer.appendChild(document.createElement('br'));
  
      selectedSetsNames[set.id] = set.name;
    });

    if(debugMode) {
      // WIP: auto-run -->
      const setCheckbox1 = document.querySelector(`input[value="base1"]`);
      const setCheckbox2 = document.querySelector(`input[value="base2"]`);
      //const setCheckbox3 = document.querySelector(`input[value="base3"]`);

      setCheckbox1.checked = true;
      setCheckbox2.checked = true;
      //setCheckbox3.checked = true;

      updateSelectedSets("base1");
      updateSelectedSets("base2");
      //updateSelectedSets("base3");

      //simulateClick(loadButton);
      // <-- WIP: auto-run
    }
  } catch (error) {
    console.error('Error while loading the sets:', error);
    alert('Error while loading the sets');
  } finally {
    // Rimuovi l'icona di caricamento e abilita i checkbox
    loadingIcon.remove();
  }
}


// async function fetchSets() {
//   const response = await fetch('https://api.pokemontcg.io/v2/sets');
//   const data = await response.json();
//   const sets = data.data;
  
//   sets.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

//   sets.forEach(set => {
//     const checkbox = document.createElement('input');
//     checkbox.type = 'checkbox';
//     checkbox.value = set.id;
//     checkbox.addEventListener('change', () => updateSelectedSets(set.id));
    
//     const label = document.createElement('label');
//     label.textContent = set.name;
    
//     setCheckboxesContainer.appendChild(checkbox);
//     setCheckboxesContainer.appendChild(label);
//     setCheckboxesContainer.appendChild(document.createElement('br'));

//     selectedSetsNames[set.id] = set.name;
//   });
// }

async function fetchCards() {
  allSelectedCards = [];

  for (const setId of selectedSets) {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`);
    const data = await response.json();
    allSelectedCards.push(...data.data);
  }

  allSelectedCards.sort((a, b) => {
    if (a.set.id !== b.set.id) {
      return a.set.releaseDate.localeCompare(b.set.releaseDate);
    } else {
      return a.number - b.number;
    }
  });  
}

function renderCardTable() {
  cardTable.innerHTML = '';

  for (let i = displayedCardsIndex; i < displayedCardsIndex + 9; i++) {
    const cardImage = document.createElement('img');
    
    if (i < allSelectedCards.length) {
      const card = allSelectedCards[i];
      cardImage.className = 'card-image';
      cardImage.src = card.images.small;

      if(card.name == "placeholder") {
        cardImage.classList.add('card-image-placeholder');
      } else {
        cardImage.classList.add('card-image-real');
      }

    } else {
      cardImage.className = 'card-image-placeholder';
      cardImage.src = 'https://crystal-cdn3.crystalcommerce.com/photos/5298083/pkm-cardback.png';
      cardImage.width = "240";
      cardImage.height = "330";
    }

    cardTable.appendChild(cardImage);
  }

  if(manualModeEnabled) {
    manualModeInit();
  }

  // Abilita o disabilita i pulsanti per la navigazione alla prima e all'ultima pagina
  firstPageButton.disabled = displayedCardsIndex === 0;
  lastPageButton.disabled = displayedCardsIndex + 9 >= allSelectedCards.length;

  prevButton.disabled = firstPageButton.disabled;
  nextButton.disabled = lastPageButton.disabled;

  updatePageIndicator();

  cardsOnPage = true;
}

function findDuplicatePokedexCards() {
  const duplicatePokedexCards = {};
  
  allSelectedCards.forEach(card => {
    const pokedexNumbers = card.nationalPokedexNumbers || [];
    pokedexNumbers.forEach(pokedexNumber => {
      if (!duplicatePokedexCards[pokedexNumber]) {
        duplicatePokedexCards[pokedexNumber] = [];
      }
      duplicatePokedexCards[pokedexNumber].push(card);
    });
  });

  return duplicatePokedexCards;
}

function getCardVariants(card) {
  const variants = [];
  if (card.rarity) {
    variants.push(card.rarity);
  }
  // Add more criteria here for card variants, e.g., card.isHolo
  return variants.length > 0 ? ` (${variants.join(', ')})` : '';
}

function renderDuplicatePokedexList(duplicatePokedexCards) {
  sameSetConflictList.innerHTML = '';
  globalConflictList.innerHTML = '';
  let globalConflicts = 0;
  let sameSetConflicts = 0;
  
  for (const pokedexNumber in duplicatePokedexCards) {
    const cardsWithSamePokedex = duplicatePokedexCards[pokedexNumber];
    if (cardsWithSamePokedex.length > 1) {
      const setsWithSamePokedex = new Set(cardsWithSamePokedex.map(card => card.set.name));

      const listItem = document.createElement('li');
      listItem.textContent = `${cardsWithSamePokedex.length} cards with Pokedex #${pokedexNumber}`;
      
      const cardList = document.createElement('ul');
      cardsWithSamePokedex.forEach(card => {
        const cardItem = document.createElement('li');
        cardItem.textContent = `${card.name}${getCardVariants(card)} (Set: ${card.set.name})`;
        cardList.appendChild(cardItem);
      });
      
      listItem.appendChild(cardList);
      
      if (setsWithSamePokedex.size > 1) {
        globalConflicts += 1;
        globalConflictList.appendChild(listItem);
      } else {
        sameSetConflicts += 1;
        sameSetConflictList.appendChild(listItem);
      }
    }
  }

  globalConflictCounter.textContent = `Global Conflicts: ${globalConflicts}, Same Set Conflicts: ${sameSetConflicts}`;
}

function updateInfoText() {
    const infoText = document.createElement('p');
    infoText.textContent = `Selected sets: ${selectedSets.length}\n`;
    
    selectedSets.forEach(setId => {
      const setCardCount = allSelectedCards.filter(card => card.set.id === setId).length;
      infoText.textContent += `Set ${selectedSetsNames[setId]}: ${setCardCount} cards | `;
    });
  
    infoText.textContent += `\nTotal cards: ${allSelectedCards.length}`;
  
    const existingInfoText = document.querySelector('#infoText');
    if (existingInfoText) {
      existingInfoText.parentNode.removeChild(existingInfoText);
    }
  
    infoText.id = 'infoText';
    loadButton.insertAdjacentElement('beforebegin', infoText);
}

function extractEvolutionLines(cards) {
  const evolutionLines = {
    basic: {},
    stage1: {},
    stage2: {}
  };

  cards.forEach(card => {
    if (card.supertype === "Pokémon") {
      const subtypes = card.subtypes || [];
      const pokedexNumber = card.nationalPokedexNumbers[0];

      if (!subtypes.includes("Stage 1") && !subtypes.includes("Stage 2")) {
        if (!evolutionLines.basic[pokedexNumber]) {
          evolutionLines.basic[pokedexNumber] = [];
        }
        evolutionLines.basic[pokedexNumber].push(card);
      } else if (subtypes.includes("Stage 1")) {
        const evolvesFrom = card.evolvesFrom || "";
        if (!evolutionLines.stage1[evolvesFrom]) {
          evolutionLines.stage1[evolvesFrom] = [];
        }
        evolutionLines.stage1[evolvesFrom].push(card);
      } else if (subtypes.includes("Stage 2")) {
        const evolvesFrom = card.evolvesFrom || "";
        if (!evolutionLines.stage2[evolvesFrom]) {
          evolutionLines.stage2[evolvesFrom] = [];
        }
        evolutionLines.stage2[evolvesFrom].push(card);
      }
    }
  });

  return evolutionLines;
}

function calculateRequiredSpaces(evolutionLines, pokedexNumber) {
  const basicCopies = (evolutionLines.basic[pokedexNumber]?.length || 0);

  let requiredSpaces = basicCopies;

  const pokemonName = evolutionLines.basic[pokedexNumber][0].name;
  
  if (evolutionLines.stage1[pokemonName]) {
    requiredSpaces += (evolutionLines.stage1[pokemonName].length);

    const stage1Name = evolutionLines.stage1[pokemonName][0].name;
    if (evolutionLines.stage2[stage1Name]) {
      requiredSpaces += (evolutionLines.stage2[stage1Name].length);
    }
  }

  return requiredSpaces;
}

function customSortingFunction(cards) {
  const evolutionLines = extractEvolutionLines(cards);
  const sortedCards = [];
  const queueCards = [];
  const priorityQueueCards = [];
  const emptySlots = [];
  const pages = [];
  const pokedexNumbers = Object.keys(evolutionLines.basic);
  let slot = {};
  const emptycard = {
    id: "N/S",
    name: "N/P",
    images: {
        small: "https://crystal-cdn3.crystalcommerce.com/photos/5298083/pkm-cardback.png"
    }     
  };

  while(pokedexNumbers.length > 0) {
    const grid = Array.from({ length: 3 }, () => Array(3).fill(null));
    
    let rowUsed = 0;
    let colUsed = 0;
    
    let pageCompleted = false;

    // svuotare la lista di priorità (stessa linea evolutiva interrotta)
    while(priorityQueueCards.length > 0) {
      const pCard = priorityQueueCards.shift();
      
      console.log("priorityQueueCards non vuota -> inserisco "+pCard.name+" in ["+rowUsed+"]["+colUsed+"]");
      
      grid[rowUsed][colUsed] = pCard;
          
      colUsed++;
      if (colUsed >= 3) {
        colUsed = 0;
        rowUsed++;
      }
    }

    // Riempie la matrice con le carte disponibili
    // for (const pokedexNumber of pokedexNumbers) {
    for (let i = 0; i < pokedexNumbers.length; i++) {
      
      if(queueCards.length > 0) {
        var spaceAvailablePre = 3 - colUsed;
        console.log("lista queueCards non vuota, spazi disponibili: " + spaceAvailablePre);
        console.log([...queueCards]);

        queueCards.forEach(cardsInQueue => {
          if(cardsInQueue.spaceReq <= spaceAvailablePre) {
            // console.log(cardsInQueue.cards);

            cardsInQueue.cards.forEach(PokemonInQueue => {
              PokemonInQueue.forEach(cardInQueue => {
                console.log("[L] inserisco " + cardInQueue.name + " da queueCards in ["+rowUsed+"]["+colUsed+"]");
                
                grid[rowUsed][colUsed] = cardInQueue;
                
                colUsed++;

                spaceAvailablePre--;
              });
            });

            console.log("[M] rimuovo le carte inserite da queueCards");
            queueCards.shift();
          }
        });
      }

      const pokedexNumber = pokedexNumbers[i];

      const requiredSpaces = calculateRequiredSpaces(evolutionLines, pokedexNumber);

      const cardName = evolutionLines.basic[pokedexNumber][0].name;

      console.log("pokedex idx: " + pokedexNumber + " (" + cardName + ") -> spazi richiesti: " + requiredSpaces);

      // if(emptySlots.length != 0) {
      //   if(requiredSpaces == 1) {
      //     console.log("ho uno slot vuoto e mi serve 1 slot, riempio il buco");

      //     //console.log([...queueCards]);
      //     //console.log([...emptySlots]);

      //     const emptySlot = emptySlots.shift();
      //     //const cardQueued = queueCards.shift();
          
      //     console.log("inserisco " + cardName + " in ["+emptySlot.row+"]["+emptySlot.col+"]");
      //     grid[emptySlot.row][emptySlot.col] = evolutionLines.basic[pokedexNumber][0]; 

      //   } else if(requiredSpaces == 2) {
      //     console.log("ho uno slot vuoto e mi servono 2 slot, riempio i buchi");
      //     emptySlots.length = 0;
      //   }
      // } else if(requiredSpaces < 4 && (colUsed + requiredSpaces > 3)) {
      
      if(requiredSpaces < 4 && (colUsed + requiredSpaces > 3)) {
        // non riesco ad inserire la linea evolutiva in questa riga
        console.log(colUsed + " + " + requiredSpaces + " > 3 -> non c'è abbastanza posto in riga");

        // queueCards.push(evolutionLines.basic[pokedexNumber]);

        console.log("inserisco la linea evolutiva di " + cardName + " in queueCards");

        tmpCardName = evolutionLines.basic[pokedexNumber][0].name;

        let cardToAdd = {
          spaceReq: requiredSpaces, 
          cards: []
        };

        cardToAdd.cards.push(evolutionLines.basic[pokedexNumber]);

        if (evolutionLines.stage1[tmpCardName]) {
          cardToAdd.cards.push(evolutionLines.stage1[tmpCardName]);

          tmpStage1Name = evolutionLines.stage1[tmpCardName][0].name;
          if (evolutionLines.stage2[tmpStage1Name]) {
            cardToAdd.cards.push(evolutionLines.stage2[tmpStage1Name]);
          }
        }
        

        queueCards.push(cardToAdd);

        // riempio con carte vuote
        while(colUsed < 3) {
          console.log("inserisco placeholder in ["+rowUsed+"]["+colUsed+"]");

          grid[rowUsed][colUsed] = emptycard;
          
          console.log("aggiungo slot {'page':"+pages.length+",'row':"+rowUsed+",'col':"+colUsed+"} a emptySlots")

          slot = {"page":pages.length,"row":rowUsed,"col":colUsed}
          emptySlots.push(slot);

          colUsed++;
        }

        if(rowUsed == 2) {
          console.log("[A] pagina "+pages.length+" completata, aggiungo a pages");
          rowUsed = 0;
          colUsed = 0;
          //pages++;
          
          pages.push(grid);

          // Imposta la variabile pageCompleted su true per indicare che la pagina è stata completata
          pageCompleted = true;

          // sortedCards.push(...grid.flat());
        } else {
          colUsed = 0;
          if (rowUsed < 2) {
            rowUsed++;
          }
        }

        console.log("nuove coordinate di partenza: ["+rowUsed+"]["+colUsed+"]");
      } else {
        // Recupera le carte dalla lista basic e inseriscile nella matrice
        evolutionLines.basic[pokedexNumber].forEach(basicCard => {
          console.log("[I] inserisco " + basicCard.name + " in ["+rowUsed+"]["+colUsed+"]");
          
          grid[rowUsed][colUsed] = basicCard;
          
          colUsed++;
          if (colUsed >= 3) {
            colUsed = 0;
            rowUsed++;
          }

          if(rowUsed == 3) {
            console.log("[B] pagina "+pages.length+" completata, aggiungo a pages");
            rowUsed = 0;
            // pages++;
            
            pages.push(grid);

            // Imposta la variabile pageCompleted su true per indicare che la pagina è stata completata
            pageCompleted = true;

            // sortedCards.push(...grid.flat());
          }
        });
        
        // Aggiungi le evoluzioni stage1 e stage2
        if (evolutionLines.stage1[cardName] && !pageCompleted) {
          const stage1Name = evolutionLines.stage1[cardName][0].name;
          
          // console.log("evoluzione stage1 -> " + stage1Name);
          
          evolutionLines.stage1[cardName].forEach(stage1Card => {
            if(pageCompleted) {
              console.log("[IV] pagina completata, inserire "+stage1Card.name+" nel primo slot utile");
              
              priorityQueueCards.push(stage1Card);
            } else {
              console.log("[II] inserisco " + stage1Card.name + " in ["+rowUsed+"]["+colUsed+"]");
              
              grid[rowUsed][colUsed] = stage1Card;

              colUsed++;
              if (colUsed >= 3) {
                colUsed = 0;
                rowUsed++;
              }

              if(rowUsed == 3) {
                console.log("[C] pagina "+pages.length+" completata, aggiungo a pages");
                rowUsed = 0;
                // pages++;
                
                pages.push(grid);

                // Imposta la variabile pageCompleted su true per indicare che la pagina è stata completata
                pageCompleted = true;

                if (evolutionLines.stage2[stage1Name]) {
                  evolutionLines.stage2[stage1Name].forEach(stage2Card => {
                    priorityQueueCards.push(stage2Card);
                  });
                }

                // sortedCards.push(...grid.flat());
              }
            }
          });
          
          if (evolutionLines.stage2[stage1Name] && !pageCompleted) {
            const stage2Name = evolutionLines.stage2[stage1Name][0].name;

            // console.log("evoluzione stage2 -> " + stage2Name);
            evolutionLines.stage2[stage1Name].forEach(stage2Card => {
              if(pageCompleted) {
                console.log("[IV] pagina completata, inserire "+stage2Card.name+" nel primo slot utile");

                priorityQueueCards.push(stage2Card);
              } else {
                console.log("[III] inserisco " + stage2Card.name + " in ["+rowUsed+"]["+colUsed+"] ");

                grid[rowUsed][colUsed] = stage2Card;
                
                colUsed++;
                if (colUsed >= 3) {
                  colUsed = 0;
                  rowUsed++;
                }

                if(rowUsed == 3) {
                  console.log("[D] pagina "+pages.length+" completata, aggiungo a pages");
                  rowUsed = 0;
                  // pages++;
                  
                  pages.push(grid);

                  // Imposta la variabile pageCompleted su true per indicare che la pagina è stata completata
                  pageCompleted = true;

                  // sortedCards.push(...grid.flat());
                }
              }
            });
          }
        }
      }

      // Rimuovi il pokedexNumber dalla lista pokedexNumbers
      pokedexNumbers.splice(i, 1);
      i--;

      // Esci dal ciclo for interno solo se la pagina è stata completata
      if (pageCompleted) {
        break;
      }
    }
  }  

  pages.forEach(page => {
    sortedCards.push(...page.flat());
  });

  return sortedCards;
}

sortButton.addEventListener('click', () => {
    const selectedSortMethod = sortMethodSelect.value;
    const sortByEvolutions = document.getElementById('evolutionSort').checked;

    if (selectedSortMethod === 'pokedex') {
      allSelectedCards.sort((a, b) => {
        const pokedexNumbersA = a.nationalPokedexNumbers || [];
        const pokedexNumbersB = b.nationalPokedexNumbers || [];
        
        if (pokedexNumbersA.length === 0 && pokedexNumbersB.length === 0) {
          return 0; // If both cards have no Pokedex numbers, keep their order unchanged
        }
        if (pokedexNumbersA.length === 0) return 1; // Put cards without Pokedex numbers at the end
        if (pokedexNumbersB.length === 0) return -1; // Put cards without Pokedex numbers at the end

        return pokedexNumbersA[0] - pokedexNumbersB[0];
      });

      if (sortByEvolutions) {        
        allSelectedCards = customSortingFunction(allSelectedCards);
      }

      duplicatePokedexContainer.style.display = 'block';
    } else if (selectedSortMethod === 'set') {
      allSelectedCards.sort((a, b) => {
        if (a.set.id !== b.set.id) {
          return a.set.releaseDate.localeCompare(b.set.releaseDate);
        } else {
          return a.number - b.number;
        }
      });
      
      duplicatePokedexContainer.style.display = 'none';
    }

    renderCardTable();
});

loadButton.addEventListener('click', async () => {
  loadButton.disabled = true;
  loadButton.textContent = 'Loading...';

  // Creare un elemento di icona di caricamento
  const loadingIcon = document.createElement('div');
  loadingIcon.className = 'loading-icon';

  // Aggiungere l'icona di caricamento al div cardTable
  cardTable.textContent = ''; // Rimuovere il contenuto esistente
  cardTable.appendChild(loadingIcon);

  await fetchCards();

  renderCardTable();
  updateInfoText();

  const duplicatePokedexCards = findDuplicatePokedexCards();
  renderDuplicatePokedexList(duplicatePokedexCards);

  loadButton.textContent = 'Load';
  loadButton.disabled = false;

  loadingIcon.remove();

  // WIP: auto-run -->
  //const sortMethodSelect = document.getElementById('evolutionSort');
  //sortMethodSelect.checked = true;
  //simulateClick(sortButton);
  // <-- WIP: auto-run
});

prevButton.addEventListener('click', () => {
  if (displayedCardsIndex >= 9) {
    displayedCardsIndex -= 9;
    renderCardTable();
  }
});

nextButton.addEventListener('click', () => {
  if (displayedCardsIndex + 9 < allSelectedCards.length) {
    displayedCardsIndex += 9;
    renderCardTable();
  }
});

firstPageButton.addEventListener('click', () => {
  displayedCardsIndex = 0;
  renderCardTable();
});

lastPageButton.addEventListener('click', () => {
  const remainder = allSelectedCards.length % 9;
  displayedCardsIndex = allSelectedCards.length - (remainder === 0 ? 9 : remainder);
  renderCardTable();
});

// function searchCard() {
//   const searchInput = document.getElementById('searchInput').value;
//   const results = [];

//   // Cerca il nome della carta tra le carte selezionate nei set
//   for (const card of allSelectedCards) {
//     if (card.name.toLowerCase().includes(searchInput.toLowerCase())) {
//       results.push(card);
//     }
//   }

//   // Visualizza i risultati in un menu a discesa
//   const dropdown = document.getElementById('searchResults');
//   dropdown.innerHTML = ''; // Cancella i risultati precedenti

//   for (const card of results) {
//     const option = document.createElement('option');
//     option.text = card.name;
//     option.value = card.id;
//     dropdown.appendChild(option);
//   }
// }

function handleSearchInput() {
  const searchInput = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchResults');
  
  // Ottieni il testo inserito dall'utente
  const searchText = searchInput.value.toLowerCase();

  // Filtra le carte compatibili con il testo inserito
  const matchingCards = allSelectedCards.filter(card => card.name.toLowerCase().includes(searchText));

  // Aggiorna la tendina con le carte compatibili
  dropdown.innerHTML = '';
  matchingCards.forEach(card => {
    const option = document.createElement('option');
    option.value = card.id;
    option.textContent = card.name;
    dropdown.appendChild(option);
  });
}
// Aggiungi gli event listener per gestire l'input e la ricerca
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', handleSearchInput);

function navigateToCard() {
  const dropdown = document.getElementById('searchResults');
  const selectedCardId = dropdown.value;

  if (selectedCardId) {
    // Trova la carta selezionata nei dati
    const selectedCard = allSelectedCards.find(card => card.id === selectedCardId);

    if (selectedCard) {
      // Calcola la pagina della griglia 9x9 in cui si trova la carta
      const cardIndex = allSelectedCards.findIndex(card => card.id === selectedCardId);
      const page = Math.floor(cardIndex / cardsPerPage) + 1; // Le pagine partono da 1

      // Calcola displayedCardsIndex in base alla pagina
      displayedCardsIndex = (page - 1) * cardsPerPage;

      // Rendi la tabella delle carte con la pagina corretta
      renderCardTable();
    }
  }
}

// Funzione per avviare la ricerca della carta selezionata nella griglia
function searchCard() {
  const dropdown = document.getElementById('searchResults');
  const selectedCardId = dropdown.value;

  if (selectedCardId) {
    // Implementa qui la navigazione alla carta selezionata
    navigateToCard(selectedCardId);
  }
}

// Funzione per calcolare il numero totale di pagine
function calculateTotalPages() {
  const totalCards = allSelectedCards.length;
  return Math.ceil(totalCards / cardsPerPage);
}

// Funzione per calcolare la pagina attuale basata su displayedCardsIndex
function calculateCurrentPage() {
  currentPage =  Math.floor(displayedCardsIndex / cardsPerPage);
  return currentPage;
}

function updatePageIndicator() {
  const pageIndicator = document.getElementById('pageIndicator');
  const totalPages = calculateTotalPages();

  pageIndicator.textContent = `Pagina ${calculateCurrentPage()+1} di ${totalPages}`;
}

function toggleManualMode() {
  manualModeEnabled = !manualModeEnabled;
  manualModeButton.textContent = manualModeEnabled ? 'Disattiva Modalità Manuale' : 'Attiva Modalità Manuale';

  if(manualModeEnabled) {
    mmDesktop.style.display = "flex";
    trashDesktopButton.style.display = "block";

    if(allCardsInDesktop.length > 0 && mmDesktop.innerHTML === "") {
      fillDesktop();
    }
  } else {
    mmDesktop.style.display = "none";
    trashDesktopButton.style.display = "none";
  }

  manualModeInit();
}

function manualModeInit() {
  // Aggiungi gestori di eventi alle carte in griglia
  draggableCards = document.querySelectorAll('.card-image'); // Seleziona le carte

  draggableCards.forEach(draggableCard => {
    draggableCard.draggable = true; // Abilita il trascinamento delle carte
    draggableCard.addEventListener('dragstart', mmHandleDragStart);
    draggableCard.addEventListener('dragover', mmHandleDragOver);
    draggableCard.addEventListener('drop', mmHandleDrop);
  });

  // Aggiungi gestori di eventi alle carte in griglia
  draggableDesktopCards = document.querySelectorAll('.card-image-desktop'); // Seleziona le carte 

  draggableDesktopCards.forEach(draggableDesktopCard => {
    draggableDesktopCard.draggable = true; // Abilita il trascinamento delle carte
    draggableDesktopCard.addEventListener('dragstart', mmHandleDragStart);
  });
}

function calculateGlobalCardIndex(gridIndex) {
  const currentPage = calculateCurrentPage(); 
  const globalCardIndex = currentPage * cardsPerPage + gridIndex;
  return globalCardIndex;
}


function mmHandleDragStart(event) {
  if (manualModeEnabled) {
    draggedCardLocation = event.target;

    if(draggedCardLocation.hasAttribute("cardindex")) {
      // desktop
      draggedCardIndex = draggedCardLocation.getAttribute("cardindex");
      draggedCardZone = "DESKTOP";
    } else {
      // griglia
      draggedCardIndex = Array.from(draggableCards).indexOf(event.target);
      // conversione ad indice globale per 'allSelectedCards'
      draggedCardIndex = calculateGlobalCardIndex(draggedCardIndex);
      draggedCardZone = "GRID";
    }

  }
}

function mmHandleDragOver(event) {
  if (manualModeEnabled) {
    event.preventDefault();
  }
}

function mmHandleDrop(event) {
  if (manualModeEnabled) {
    event.preventDefault();
    let targetIndex = Array.from(draggableCards).indexOf(event.target);
    // conversione ad indice globale per 'allSelectedCards'
    targetIndex = calculateGlobalCardIndex(targetIndex);

    if(draggedCardZone == "GRID") {
      if (targetIndex !== draggedCardIndex) {
        // Effettua lo scambio delle carte nei tuoi dati (allSelectedCards)
        const temp = allSelectedCards[draggedCardIndex];
        allSelectedCards[draggedCardIndex] = allSelectedCards[targetIndex];
        allSelectedCards[targetIndex] = temp;
  
        // Aggiorna l'interfaccia utente con le nuove posizioni delle carte
        renderCardTable();
      }
    } else if(draggedCardZone == "DESKTOP") {      
      if(event.target.classList.contains('card-image-placeholder')) {
        // si cerca di sostituire una carta da desktop ad uno slot vuoto su grid
        allSelectedCards[targetIndex] = allCardsInDesktop[draggedCardIndex];
        // devo rimuovere la carta dal desktop
        allCardsInDesktop[draggedCardIndex] = null;

        // aggiorna desktop
        fillDesktop();
        
        // Aggiorna l'interfaccia utente con le nuove posizioni delle carte
        renderCardTable();
      }
    }
  }
}

// Funzione per salvare il raccoglitore in locale
function saveCollectionLocally() {
  localStorage.setItem('collection', JSON.stringify(allSelectedCards));
  localStorage.setItem('collection-desktop', JSON.stringify(allCardsInDesktop));
}

// Funzione per scaricare la collezione come file JSON
function downloadCollectionAsJSON() {
  const collectionData = JSON.stringify(allSelectedCards);
  const blob = new Blob([collectionData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'collection.json';

  // Aggiungi il link al documento e simula un clic
  document.body.appendChild(a);
  a.click();

  // Rimuovi il link dal documento
  document.body.removeChild(a);
}

// Gestore del click sul bottone di salvataggio/scaricamento
document.getElementById('saveOrDownloadButton').addEventListener('click', function () {
  if(cardsOnPage) {
    const selectedMode = document.getElementById('saveMode').value;
    
    if (selectedMode === 'local') {
      saveCollectionLocally();
    } else if (selectedMode === 'json') {
      downloadCollectionAsJSON();
    }

    alert('collezione salvata correttamente!')
  }
});

// Funzione per caricare la collezione dalla memoria locale
function loadCollectionFromLocal() {
  const collectionData = localStorage.getItem('collection');
  const collectionDesktopData = localStorage.getItem('collection-desktop');

  if (collectionData) {
    allSelectedCards = JSON.parse(collectionData);
    renderCardTable(); // Aggiorna l'interfaccia utente
  } else {
    alert('Error: no collection available');
  }

  if(collectionDesktopData) {
    allCardsInDesktop = JSON.parse(collectionDesktopData);
    fillDesktop();
  }
}

// Funzione per caricare la collezione da un file JSON
function loadCollectionFromJSONFile(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const collectionData = event.target.result;
    allSelectedCards = JSON.parse(collectionData);
    renderCardTable(); // Aggiorna l'interfaccia utente
  };

  reader.readAsText(file);
}

// Gestore dell'evento di selezione di un file
document.getElementById('loadJsonInput').addEventListener('change', function (event) {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    loadCollectionFromJSONFile(selectedFile);
  }
});

// Gestore del click sul bottone di caricamento
document.getElementById('loadCollButton').addEventListener('click', function () {
  const selectedMode = document.getElementById('loadMode').value;

  if (selectedMode === 'local') {
    loadCollectionFromLocal();
  } else if (selectedMode === 'json') {
    // Attiva il selettore di file per scegliere il file JSON
    document.getElementById('loadJsonInput').click();
  }
});

// desktop 
const newPlaceholderCard = {
  "name": "placeholder",
  "images": {
      "small": "https://crystal-cdn3.crystalcommerce.com/photos/5298083/pkm-cardback.png"
  }
};

function fillDesktop() {
  // reset
  mmDesktop.innerHTML = "";

  allCardsInDesktop.forEach(function callback(cardToInsert, cardIndex) {
    if(cardToInsert) {
      mmDesktop.appendChild(createCardElement(cardToInsert, cardIndex));
    }
  });
}

// Funzione per spostare una carta dalla griglia al desktop
function moveToDesktop(cardIndex) {
  let card = allSelectedCards[cardIndex];

  if(card) {
    mmDesktop.appendChild(createCardElement(card, cardIndex)); // Aggiungi la carta al desktop
    allCardsInDesktop[cardIndex] = card;
    
    // Assegna l'oggetto newCard all'elemento con l'indice cardIndex
    allSelectedCards[cardIndex] = newPlaceholderCard;

    renderCardTable(); // Aggiorna la griglia
  }
}

// Funzione per creare un elemento carta
function createCardElement(card, cardIndex) {
  let cardElement = document.createElement('img');

  cardElement.className = 'card-image-desktop';
  cardElement.src = card.images.small;
  cardElement.setAttribute('cardIndex', cardIndex);

  return cardElement;
}

mmDesktop.addEventListener('dragover', (event) => {
  if (manualModeEnabled) {
    if(draggedCardZone == "GRID") {
      event.preventDefault(); // Consenti il rilascio
    }
  }
});

mmDesktop.addEventListener('drop', (event) => {
  if (manualModeEnabled) {
    event.preventDefault();
    
    // Verifica se il rilascio avviene sulla scrivania
    if(draggedCardIndex && draggedCardZone == "GRID") {
      moveToDesktop(draggedCardIndex); // Sposta la carta al desktop
    }
  }
});

function trashDesktop() {
  if (manualModeEnabled) {
    allCardsInDesktop = [];
    mmDesktop.innerHTML = "";
  }
};

fetchSets();

