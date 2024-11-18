require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://KhangYogaApp:khangkhanh0304@yogaapp.c0ddr.mongodb.net/';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const yogaClassSchema = new mongoose.Schema({
    id: String,
    name: String,
    date: String,
    time: String,
    capacity: Number,
    duration: Number,
    price: Number,
    type: String,
    description: String,
});

const classInstanceSchema = new mongoose.Schema({
    id: String,
    yogaClassId: String,
    date: String,
    teacher: String,
    comments: String,
});

const YogaClass = mongoose.model('YogaClass', yogaClassSchema);
const ClassInstance = mongoose.model('ClassInstance', classInstanceSchema);

app.post('/sync', async (req, res) => {
    try {
        const { yogaClasses, classInstances } = req.body;

        if (!yogaClasses || !classInstances) {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ!' });
        }

        await YogaClass.deleteMany({});
        await ClassInstance.deleteMany({});

        await YogaClass.insertMany(yogaClasses);
        await ClassInstance.insertMany(classInstances);

        res.status(200).json({ message: 'Đồng bộ thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/classes', async (req, res) => {
    try {
        const classes = await YogaClass.find();
        res.status(200).json(classes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/classes', async (req, res) => {
    try {
        const yogaClass = new YogaClass(req.body);
        await yogaClass.save();
        res.status(201).json(yogaClass);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/class-instances', async (req, res) => {
    try {
        const instances = await ClassInstance.find();
        res.status(200).json(instances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/class-instances', async (req, res) => {
    try {
        const instance = new ClassInstance(req.body);
        await instance.save();
        res.status(201).json(instance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
