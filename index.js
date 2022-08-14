// Importing modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./config/dbconn");
const jwt = require("jsonwebtoken");
const middleware = require("./middleware/auth");
const { compare, hash } = require("bcrypt");
const e = require("express");
// Express app
const app = express();
// Express router
const router = express.Router();
// Configuration
const port = parseInt(process.env.PORT);

app.use((req, res, next) => {
  // res.setHeader("Access-Control-Allow-Origin", "*");
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  });
  next();
});

app.use(
  express.static("public"),
  router,
  cors(),
  express.json(),
  express.urlencoded({
    extended: true,
  })
);
//
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// home
router.get("/", (req, res) => {
  res.sendFile(__dirname + "/" + "index.html");
});
// users functionality
// ============================================================================================
//id 
// router.put("/users/i", (req, res) => {
// const strid = `SELECT id FROM users`

// db.query(strid, (err, results) => {
//   if (err) throw err
//   const result = results

//   result.forEach((e, i) => {
//     e.id = i +1
//   });
//   const strup = `UPDATE users SET id = ? WHERE id = ?`
  
//   db.query(strup, [result], (err, results) => {
//     if (err) throw err
//     res.json({
//       msg : "Success"
//     })
//     // console.table(results)
//   })

// })
// })
// Get users
router.get("/users", middleware, (req, res) => {
  if (req.user.usertype === "Admin") {
    const strQry = `
      SELECT *
      FROM users;
      `;
    db.query(strQry, (err, results) => {
      if (err) throw err;
      res.json({
        status: 200,
        results: results <= 0 ? "Sorry, no product was found." : results,
        test: req.user.id,
      });
    });
  } else {
    res.json({
      msg: "Only Admins are able to view this, Sumimasen",
    });
  }
  // Query
});

// Get one users
router.get("/users/:id", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM users 
    WHERE id = ?;
    `;

  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json(
      // results
      {
        status: 200,
        results: results,
        // results: results.length <= 0 ? "Sorry, no product was found." : results,
      }
    );
  });
});

// User registration
router.post("/users", bodyParser.json(), async (req, res) => {
  try {
    const bd = req.body;
    if (bd.usertype === "" || bd.usertype === null) {
      bd.usertype = "user";
    }

    const emailQ = "SELECT email from users WHERE ?";
    let email = {
      email: bd.email,
    };
    let date = {
      date: new Date().toLocaleDateString(),
    };
    let cart = {
      cart: null,
    };

    db.query(emailQ, email, async (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({
          msg: "Email Exists",
        });
      } else {
        // Encrypting a password
        // Default value of salt is 10.
        bd.password = await hash(bd.password, 10);
        // Query
        const strQry = `
        
        ALTER TABLE users AUTO_INCREMENT = 1;
        
        INSERT INTO users(firstname, lastname, email, usertype, contact, address, password, joindate)  
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.query(
          strQry,
          [
            bd.firstname,
            bd.lastname,
            bd.email,
            bd.usertype,
            bd.contact,
            bd.address,
            bd.password,
            date.date,
          ],
          (err, results) => {
            if (err) throw err;
            const payload = {
              user: {
                firstname: bd.firstname,
                lastname: bd.lastname,
                email: bd.email,
                usertype: bd.usertype,
                contact: bd.contact,
                address: bd.address,
                cart: cart.cart,
              },
            };
            jwt.sign(
              payload,
              process.env.jwtSecret,
              {
                expiresIn: "365d",
              },
              (err, token) => {
                if (err) throw err;
                res.json({
                  msg: "Registration Successful",
                  user: payload.user,
                  token: token,
                });
                // res.json(payload.user);
              }
            );
          }
        );
      }
    });
  } catch (e) {
    console.log(`Registration Error: ${e.message}`);
  }
});
// register dummy data
// {
//   "firstname": "Muzzammil",
//   "lastname": "Charles",
//   "email": "mz@gmail.com",
//   "usertype": "",
//   "contact": "0695585895",
//   "address": "blank",
//   "password": "password"
// }

// Login
router.patch("/users", bodyParser.json(), (req, res) => {
  try {
    // Get email and password
    const { email, password } = req.body;
    const strQry = `
        SELECT *
        FROM users 
        WHERE email = '${email}';
        `;
    db.query(strQry, async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        res.json({
          msg: "Email not found",
        });
      } else {
        const ismatch = await compare(password, results[0].password);
        // res.json({
        //   results: await compare(userpassword, results[0].userpassword),
        //   // ? results
        //   // : "You provided a wrong password",
        // });
        // res.send(results),
        if (ismatch === true) {
          const payload = {
            user: {
              id: results[0].id,
              firstname: results[0].firstname,
              lastname: results[0].lastname,
              contact: results[0].contact,
              email: results[0].email,
              usertype: results[0].usertype,
              address: results[0].address,
              cart: results[0].cart,
            },
          };
          jwt.sign(
            payload,
            process.env.jwtSecret,
            {
              expiresIn: "365d",
            },
            (err, token) => {
              if (err) throw err;
              res.json({
                msg: "Login Successful",
                user: payload.user,
                token: token,
              });
              // res.json(payload.user);
            }
          );
        } else {
          res.json({
            msg: "You entered the wrong password",
          });
        }
      }
    });
  } catch (e) {
    console.log(`From login: ${e.message}`);
  }
});
// login dummy data
// {
//   "email": "mz@gmail.com",
//   "password":"password"
// }

// Update users
router.put("/users/:id", middleware, bodyParser.json(), (req, res) => {
  const { firstname, lastname, email, address, usertype } = req.body;

  const user = {
    firstname,
    lastname,
    email,
    address,
    usertype,
  };
  // Query
  const strQry = `UPDATE users
     SET ?
     WHERE id = ${req.params.id}`;
  db.query(strQry, user, (err, data) => {
    if (err) throw err;
    res.json({
      msg: "User info Updated",
    });
  });
});

// Delete users
router.delete("/users/:id", middleware, (req, res) => {
  if (req.user.usertype === "Admin") {
    // Query
    const strQry = `
      DELETE FROM users 
      WHERE id = ?;
      `;
    db.query(strQry, [req.params.id], (err, data, fields) => {
      if (err) throw err;
      res.json({
        msg: "Item Deleted",
      });
    });
  } else {
    res.json({
      msg: "Only Admins are Allowed to do this, please get on my level",
    });
  }
});

// Verify
router.get("/verify", (req, res) => {
  const token = req.header("x-auth-token");
  jwt.verify(token, process.env.jwtSecret, (error, decodedToken) => {
    if (error) {
      res.status(401).json({
        msg: "Unauthorized Access!",
      });
    } else {
      res.status(200);
      res.send(decodedToken);
    }
  });
});
// ===========================================================================================
// cart functionalty
// ===========================================================================================
// get cart items from user
router.get("/users/:id/cart", middleware, (req, res) => {
  try {
    const strQuery = "SELECT cart FROM users WHERE id = ?";
    db.query(strQuery, [req.user.id], (err, results) => {
      if (err) throw err;
      (function Check(a, b) {
        a = parseInt(req.user.id);
        b = parseInt(req.params.id);
        if (a === b) {
          // res.json({
          //   status: 200,
          //   result: results,
          // });
          res.send(results[0].cart);
        } else {
          res.json({
            msg: "Please Login",
          });
        }
      })();
    });
  } catch (error) {
    throw error;
  }
});

// add cart items
router.post("/users/:id/cart", middleware, bodyParser.json(), (req, res) => {
  try {
    let { id } = req.body;
    const qCart = ` SELECT cart
    FROM users
    WHERE id = ?;
    `;
    db.query(qCart, req.user.id, (err, results) => {
      if (err) throw err;
      let cart;
      if (results.length > 0) {
        if (results[0].cart === null) {
          cart = [];
        } else {
          cart = JSON.parse(results[0].cart);
        }
      }
      const strProd = `
    SELECT *
    FROM products
    WHERE id = ${id};
    `;
      db.query(strProd, async (err, results) => {
        if (err) throw err;

        let product = {
          prodid: results[0].id,
          prodname: results[0].prodname,
          prodimg: results[0].prodimg,
          category: results[0].category,
          price: results[0].price,
          stock: results[0].stock,
          totalamount: results[0].totalamount,
          userid: results[0].userid,
        };

        cart.push(product);
        // res.send(cart)
        const strQuery = `UPDATE users
    SET cart = ?
    WHERE (id = ${req.user.id})`;
        db.query(strQuery, /*req.user.id */ JSON.stringify(cart), (err) => {
          if (err) throw err;
          res.json({
            results,
            msg: "Product added to Cart",
          });
        });
      });
    });
  } catch (error) {
    console.log(error.message);
  }
});

// delete one item from cart
router.delete("/users/:id/cart/:prodid", middleware, (req, res) => {
  const dCart = `SELECT cart
  FROM users
  WHERE id = ?`;
  db.query(dCart, req.user.id, (err, results) => {
    if (err) throw err;
    let item = JSON.parse(results[0].cart).filter((x) => {
      return x.prodid != req.params.prodid;
    });
    // res.send(item)
    const strQry = `
  UPDATE users
  SET cart = ?
  WHERE id= ? ;
  `;
      db.query(
        strQry,
        [JSON.stringify(item), req.user.id],
        (err, data, fields) => {
          if (err) throw err;
          res.json({
            msg: "Item Removed from Cart",
          });
        }
      );
  });
});

// delete all cart items
router.delete("/users/:id/cart", middleware, (req, res) => {
  const dCart = `SELECT cart 
  FROM users
  WHERE id = ?`;

  db.query(dCart, req.user.id, (err, results) => {
    // let cart =
  });
  const strQry = `
  UPDATE users
    SET cart = null
    WHERE (id = ?);
    `;
  db.query(strQry, [req.user.id], (err, data, fields) => {
    if (err) throw err;
    res.json({
      msg: "Item Deleted",
    });
  });
});
// ===========================================================================================

// products functionality
// ============================================================================================
// Create new products
router.post("/products", middleware, bodyParser.json(), (req, res) => {
  try {
    if (req.user.usertype === "Admin") {
      const bd = req.body;
      bd.totalamount = bd.stock * bd.price;
      // Query
      // id, prodname, prodimg, quantity, price, totalamount, userid
      const strQry = `
        INSERT INTO products(prodname, prodimg, category, price, stock, totalamount, userid)
        VALUES(?, ?, ?, ?, ?, ?, ?);
        `;
      //
      db.query(
        strQry,
        [
          bd.prodname,
          bd.prodimg,
          bd.category,
          bd.price,
          bd.stock,
          bd.totalamount,
          req.user.id,
        ],
        (err) => {
          if (err) throw err;
          res.json({
            added: bd,
            msg: "New Product added",
          });
        }
      );
    } else {
      res.json({
        msg: "Only Admins are allowed to add products",
      });
    }
  } catch (e) {
    console.log(`Create a new product: ${e.message}`);
  }
});
// add product dummy data
/* 
{
  "prodname":"Banana",
  "prodimg":"https://i.postimg.cc/DZ7pV6mR/png-transparent-banana-banana-natural-foods-food-fitness-thumbnail.png",
  "quantity":5,
  "price":27.99,
  "dateCreated":"2022-08-02 00:00:00"
}
*/
// test
// Get all products
router.get("/products", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM products;
    `;
  db.query(strQry, (err, results) => {
    if (err) throw err;
    res.json(
      // results
      {
        status: 200,
        results: results,
      }
    );
  });
});

// Get one product
router.get("/products/:id", (req, res) => {
  // Query
  const strQry = `
    SELECT *
    FROM products
    WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err, results) => {
    if (err) throw err;
    res.json(
      // results
      {
        status: 200,
        results: results.length <= 0 ? "Sorry, no product was found." : results,
      }
    );
  });
});

// Update product
router.put("/products/:id", middleware, bodyParser.json(), async (req, res) => {
  const { prodname, prodimg, price, quantity } = req.body;
  let sql = `UPDATE products SET ? WHERE id = ${req.params.id} `;
  const product = {
    prodname,
    prodimg,
    category,
    price,
    stock,
  };
  db.query(sql, product, (err) => {
    if (err) throw err;
    res.json({
      msg: "Updated Item Successfully",
    });
  });
});

// Delete product
router.delete("/products/:id", middleware, (req, res) => {
  // Query
  const strQry = `
    DELETE FROM products 
    WHERE id = ?;
    `;
  db.query(strQry, [req.params.id], (err) => {
    if (err) throw err;
    res.json({
      msg: "Item Deleted",
    });
  });
});
