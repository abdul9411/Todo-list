const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

// Starting items in the list
const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + buttton to add a new items"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  // When the home page is loaded
  Item.find({}, function(err, results){
    if (results.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        }
      });
      res.redirect('/');
    } else{
    res.render("list", {
      listName: "Today",
      newListItems: results
    });
  }
  });


});

app.get("/:destination", function(req,res){
  const path = _.capitalize(req.params.destination);
  // Allows the user to access any number of lists with different titles and items based on the URL
  List.findOne({name: path}, function(err, results){
      if(!err){
          if(!results){
              const list = new List({
                  name: path,
                  items: defaultItems
                });
                list.save();
                res.redirect("/" + path);
              }else{
                  res.render("list", {
                  listName: results.name,
                  newListItems: results.items
                });
            }
            }
 });

});

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
      name: itemName
    });

    if (listName === "Today"){
      newItem.save();
      res.redirect("/");
    }else{
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
    }


});

app.post("/delete", function(req,res){
    const itemToRemove = req.body.checkbox;
    const listName = req.body.listName;
    // Checks which list to remove the item from
    if(listName === 'Today'){
      Item.findByIdAndRemove(itemToRemove, function(err){
          if (!err){
            res.redirect("/");
          }
      });
    }else{
      List.findOneAndUpdate({name: listName},
        // removes the item from the array of items
        {$pull: {items: {_id: itemToRemove}}},
        function(err, result){
        if (!err){
          res.redirect("/" + listName);
        }
      });
    }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
