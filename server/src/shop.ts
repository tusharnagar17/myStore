import express, {Request, Response} from "express";
import { Pool } from "pg";
import {drizzle} from "drizzle-orm/node-postgres"
import { products } from "./db/schema";
import { eq } from "drizzle-orm";

const router = express.Router()

const pool = new Pool({connectionString: `${process.env.DATABASE_URL}` , ssl: {rejectUnauthorized: false}})
const db = drizzle(pool)

// Error handler for database queries
const handleQueryError = (err: any, res:Response) => {
    console.error("Error executing query: ", err);
    res.status(500).json({ error: 'An error occurred while executing the query.' });
}  

// Get all products
router.get('/products', async (req: Request, res: Response) => {
    try {
        const rows = await db.select().from(products)
        res.status(200).json(rows)
    } catch(err) {
        handleQueryError(err, res)
    }
});

// Get a single product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
    try {
        const {id} = req.params
        const rows = await db.select().from(products).where(eq(products.id, +id))
        res.status(200).json(rows)
    } catch (error) {
        handleQueryError(error, res)
    }
})
export default router