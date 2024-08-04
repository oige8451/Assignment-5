/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: _______Tomi ige_______________ Student ID: ____169604220 __________ Date: _______3/8/24_______
*
*  Published URL: __________________________https://assignment-5-pink.vercel.app_______________________________
*
********************************************************************************/

const legoSets = require("./modules/legoSets");
const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const app = express();

// Set the view engine to EJS
app.set("view engine", "ejs");
//mark the "public" folder as "static"
app.use(express.static("public"));
// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// start the server on the port and output a confirmation to the console
app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));

// Initialize the sets data and start the server only after successful initialization
legoSets
  .initialize()
  .then(() => {
    console.log("Lego sets data initialized.");

    // Define the routes
    app.get("/", (req, res) => {
      res.render("home");
    });

    app.get("/about", (req, res) => {
      res.render("about");
    });

    app.get("/lego/sets", (req, res) => {
      const theme = req.query.theme; // Get theme query parameter
      if (theme) {
        legoSets
          .getSetsByTheme(theme)
          .then((sets) => {
            if (sets.length === 0) {
              return res.status(404).render("404", { message: "No sets found for the selected theme." });
            }
            res.render("sets", { sets: sets });
          })
          .catch((error) =>
            res.status(404).render("404", { message: `Error retrieving sets by theme: ${error.message}` })
          );
      } else {
        legoSets
          .getAllSets()
          .then((sets) => {
            if (sets.length === 0) {
              return res.status(404).render("404", { message: "No sets found." });
            }
            res.render("sets", { sets: sets });
          })
          .catch((error) =>
            res.status(404).render("404", { message: `Error retrieving all Lego sets: ${error.message}` })
          );
      }
    });
    
    app.get("/lego/sets/:set_num", (req, res) => {
      const setNum = req.params.set_num; // Get set_num from route parameters
      legoSets
        .getSetByNum(setNum)
        .then((set) => {
          if (set) {
            res.render("set", { set: set });
          } else {
            res.status(404).render("404", { message: `Lego set with set_num ${setNum} not found.` });
          }
        })
        .catch((error) =>
          res.status(404).render("404", { message: `Error retrieving set by set_num: ${error.message}` })
        );
    });


    app.get('/lego/addSet', (req, res) => {
      legoSets.getAllThemes()
        .then(themes => {
          res.render('addSet', { themes });
        })
        .catch(error => {
          res.status(500).render('500', { message: `Error loading themes: ${error.message}` });
        });
    });


    app.post('/lego/addSet', (req, res) => {
      const { set_num, name, year, num_parts, img_url, theme_id } = req.body;

      legoSets.addSet({ set_num, name, year, num_parts, img_url, theme_id })
        .then(() => {
          res.redirect('/lego/sets');
        })
        .catch(error => {
          res.status(500).render('500', { message: `Error adding set: ${error.message}` });
        });
    });

   // GET /lego/editSet/:num
   app.get('/lego/editSet/:num', (req, res) => {
    const setNum = req.params.num;
    Promise.all([
      legoSets.getSetByNum(setNum),
      legoSets.getAllThemes()
    ])
    .then(([set, themes]) => {
      res.render('editSet', { themes, set });
    })
    .catch(error => {
      res.status(404).render("404", { message: `Error retrieving set or themes: ${error.message}` });
    });
  });

  // POST /lego/editSet
  app.post('/lego/editSet', (req, res) => {
    const { set_num, name, year, num_parts, img_url, theme_id } = req.body;

    legoSets.editSet(set_num, { name, year, num_parts, img_url, theme_id })
      .then(() => {
        res.redirect('/lego/sets');
      })
      .catch(error => {
        res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${error.message}` });
      });
  });

  app.get('/lego/deleteSet/:num', (req, res) => {
    const setNum = req.params.num;

    legoSets.deleteSet(setNum)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch(err => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});


  // Handle 404 errors
    app.use((req, res) => {
      res.status(404).render("404", { message: "Page not found." });
    });

    // Handle 500 errors
    app.use((err, req, res, next) => {
      res.status(500).render('500', { message: `Internal Server Error: ${err.message}` });
    });
    

  })
  .catch((error) => {
    console.error(`Initialization failed: ${error.message}`);
  });