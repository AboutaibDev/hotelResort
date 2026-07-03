"use strict";
const path = require("path");
const { PrismaClient } = require(path.join(__dirname, "..", "app", "generated", "prisma"));
const db = new PrismaClient();

const roomImages = [
  [1, '["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=800"]'],
  [2, '["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&q=80&w=800"]'],
  [3, '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800"]'],
  [4, '["https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1614518921956-0e40c4b83e37?auto=format&fit=crop&q=80&w=800"]'],
  [5, '["https://images.unsplash.com/photo-1439130490301-25e322d88054?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&q=80&w=800"]'],
  [6, '["https://images.unsplash.com/photo-1578774296842-c45e472b3028?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800"]'],
];
const actImages = [
  [1, '["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800"]'],
  [2, '["https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1532339142463-fd0a8979791a?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=800"]'],
  [3, '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&q=80&w=800"]'],
  [4, '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800"]'],
  [5, '["https://images.unsplash.com/photo-1474524955719-b9f87c50ce47?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800"]'],
  [6, '["https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&q=80&w=800","https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&q=80&w=800"]'],
];

function run() {
  var idx = 0;
  function next() {
    if (idx < roomImages.length) {
      var pair = roomImages[idx++];
      return db.rooms.update({ where: { id: pair[0] }, data: { image: pair[1] } })
        .then(function() { console.log("Room " + pair[0] + " fixed"); return next(); });
    }
    idx = 0;
    function nextAct() {
      if (idx < actImages.length) {
        var pair = actImages[idx++];
        return db.activities.update({ where: { id: pair[0] }, data: { image: pair[1] } })
          .then(function() { console.log("Activity " + pair[0] + " fixed"); return nextAct(); });
      }
      console.log("All done!");
      return db["$disconnect"]();
    }
    return nextAct();
  }
  return next();
}

run().catch(function(e) { console.error(e.message); process.exit(1); });
