// BETA FEATURES (WIP)

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