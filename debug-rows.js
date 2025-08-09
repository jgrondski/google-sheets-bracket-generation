// Debug script to check row calculations

console.log("OLD Match row calculations (starting at row 3):");
for (let matchIndex = 0; matchIndex < 12; matchIndex++) {
    const player1Row = 3 + (matchIndex * 3);
    const player2Row = player1Row + 1;
    console.log(`Match ${matchIndex + 1}: Player1 Row ${player1Row}, Player2 Row ${player2Row}`);
}

console.log("\nNEW Match row calculations (starting at row 2):");
for (let matchIndex = 0; matchIndex < 12; matchIndex++) {
    const player1Row = 2 + (matchIndex * 3);
    const player2Row = player1Row + 1;
    console.log(`Match ${matchIndex + 1}: Player1 Row ${player1Row}, Player2 Row ${player2Row}`);
}

console.log("\nExpected structure:");
console.log("Row 1: Headers");
console.log("Row 2: Match 1 Player 1");
console.log("Row 3: Match 1 Player 2"); 
console.log("Row 4: Empty");
console.log("Row 5: Match 2 Player 1");
console.log("Row 6: Match 2 Player 2");
console.log("Row 7: Empty");
console.log("Row 8: Match 3 Player 1");
console.log("Row 9: Match 3 Player 2");
console.log("...");
