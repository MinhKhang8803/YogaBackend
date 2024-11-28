require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Method: ${req.method}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    next();
});

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const mongoUri = process.env.MONGO_URI || 
    'mongodb+srv://KhangYogaApp:khangkhanh0304@yogaapp.c0ddr.mongodb.net/YogaDB';

mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const yogaClassSchema = new mongoose.Schema({
    id: { type: String, required: true },
    dayOfWeek: String,
    time: String,
    type: String,
    price: Number,
    capacity: Number,
    duration: Number,
    description: String,
});

const classInstanceSchema = new mongoose.Schema({
    id: { type: String, required: true },
    yogaClassId: String,
    date: String,
    teacher: String,
    comments: String,
});

const YogaClass = mongoose.model('YogaClass', yogaClassSchema);
const ClassInstance = mongoose.model('ClassInstance', classInstanceSchema);

app.post('/sync', async (req, res) => {
    try {
        console.log('Received Payload:', req.body);

        const { yogaClasses, classInstances } = req.body;

        if (!yogaClasses || !classInstances) {
            return res.status(400).json({ 
                error: 'Payload không hợp lệ! Yêu cầu có yogaClasses và classInstances.' 
            });
        }

        console.log('Sync Payload:', { yogaClasses, classInstances });

        await YogaClass.deleteMany({});
        await ClassInstance.deleteMany({});

        await YogaClass.insertMany(
            yogaClasses.map((cls) => ({
                id: cls.id,
                dayOfWeek: cls.dayOfWeek,
                time: cls.time,
                type: cls.type,
                price: cls.price,
                capacity: cls.capacity,
                duration: cls.duration,
                description: cls.description,
            }))
        );

        await ClassInstance.insertMany(
            classInstances.map((inst) => ({
                id: inst.id,
                yogaClassId: inst.yogaClassId,
                date: inst.date,
                teacher: inst.teacher,
                comments: inst.comments,
            }))
        );

        res.status(200).json({ message: 'Đồng bộ thành công!' });
    } catch (err) {
        console.error('Error during sync:', err);
        res.status(500).json({ error: 'Đồng bộ thất bại: ' + err.message });
    }
});

app.get('/classes', async (req, res) => {
    try {
        const classes = await YogaClass.find();
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
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
        console.error('Error fetching class instances:', err);
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

app.post('/schedule', async (req, res) => {
    try {
        const { classIds } = req.body; 

        if (!classIds || !Array.isArray(classIds)) {
            return res.status(400).json({ error: 'Invalid class IDs' });
        }

        const schedule = await ClassInstance.find({ yogaClassId: { $in: classIds } });

        res.status(200).json(schedule);
    } catch (err) {
        console.error('Error fetching schedule:', err);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
