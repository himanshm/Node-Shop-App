import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express, { static as expressStatic } from 'express';
import bodyParser from 'body-parser';

import { get404 } from './controllers/error.js';
import sequalize from './util/database.js';
import Product from './models/product.js';
import User from './models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

import adminRoutes from './routes/admin.js';
import shopRoutes from './routes/shop.js';
import Cart from './models/cart.js';
import CartItem from './models/cart-item.js';
import Order from './models/order.js';
import OrderItem from './models/order-items.js';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressStatic(join(__dirname, 'public')));

// Create a user
app.use(async (req, res, next) => {
  try {
    const user = await User.findByPk(1);

    // Store the Sequelize object user in the request
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(get404);

// Setting relations
Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product); // optional

User.hasOne(Cart);
Cart.belongsTo(User); // optional

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

async function initialize() {
  try {
    // await sequalize.sync({ force: true });
    await sequalize.sync();
    console.log('Database synchronized successfully.');

    let user = await User.findByPk(1);

    if (!user) {
      user = await User.create({ name: 'Himansh', email: 'him@example.com' });
      // console.log('User created:', user);
    }

    const cart = await user.createCart();
    // console.log('Cart creted: ', cart);

    // console.log('User found:', user);
    app.listen(3000);
    console.log('Server is listening on port 3000.');
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

initialize();
