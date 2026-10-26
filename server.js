
const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3000;
const FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

// Read and save data
async function readData() {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
}

async function saveData(data) {
    await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

// Get stock status
function format(product) {
    let status = 'AVAILABLE';

    if (product.stock === 0) {
        status = 'OUT OF STOCK';
    } else if (product.stock <= 5) {
        status = 'LOW STOCK';
    }

    return { ...product, stock_status: status };
}

// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await readData();
        res.json(products.map(format));
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        const products = await readData();
        const product = products.find(p => p.id === id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(format(product));
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST new product
app.post('/api/products', async (req, res) => {
    try {
        const { product_name, category, price, stock } = req.body;

        if (
            typeof product_name !== 'string' || !product_name.trim() ||
            typeof category !== 'string' || !category.trim() ||
            typeof price !== 'number' || !Number.isFinite(price) || price < 0 ||
            typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0
        ) {
            return res.status(400).json({
                message: 'Enter valid details and non-negative whole stock.'
            });
        }

        const products = await readData();
        const id = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;

        const product = {
            id,
            product_name: product_name.trim(),
            category: category.trim(),
            price,
            stock
        };

        products.push(product);
        await saveData(products);

        res.status(201).json({
            message: 'Product added successfully.',
            product: format(product)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE product by ID
app.delete('/api/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        const products = await readData();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const deleted = products.splice(index, 1)[0];
        await saveData(products);

        res.json({
            message: 'Product deleted successfully.',
            product: format(deleted)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
