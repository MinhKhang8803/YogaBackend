require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Kết nối MongoDB
const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://KhangYogaApp:khangkhanh0304@yogaapp.c0ddr.mongodb.net/YogaDB';
mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Schema YogaClass
const yogaClassSchema = new mongoose.Schema({
    yogaClassId: { type: String, required: true }, // Thay id thành yogaClassId
    dayOfWeek: String,
    time: String,
    type: String,
    price: Number,
    capacity: Number,
    duration: Number,
    description: String,
});

// Schema ClassInstance
const classInstanceSchema = new mongoose.Schema({
    instanceId: { type: String, required: true }, // Thay id thành instanceId
    yogaClassId: String,
    date: String,
    teacher: String,
    comments: String,
});

// Model MongoDB
const YogaClass = mongoose.model('YogaClass', yogaClassSchema);
const ClassInstance = mongoose.model('ClassInstance', classInstanceSchema);

// Endpoint Sync
app.post('/sync', async (req, res) => {
    try {
        const { yogaClasses, classInstances } = req.body;

        // Kiểm tra payload
        if (!yogaClasses || !classInstances) {
            return res
                .status(400)
                .json({ error: 'Payload không hợp lệ! Yêu cầu có yogaClasses và classInstances.' });
        }

        // Ghi log payload nhận
        console.log('Sync Payload:', { yogaClasses, classInstances });

        // Xóa dữ liệu cũ
        await YogaClass.deleteMany({});
        await ClassInstance.deleteMany({});

        // Thêm dữ liệu mới
        await YogaClass.insertMany(
            yogaClasses.map((cls) => ({
                yogaClassId: cls.id, // Map từ client field `id` thành `yogaClassId`
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
                instanceId: inst.id, // Map từ client field `id` thành `instanceId`
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

// Lấy danh sách Yoga Classes
app.get('/classes', async (req, res) => {
    try {
        const classes = await YogaClass.find();
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Thêm Yoga Class mới
app.post('/classes', async (req, res) => {
    try {
        const yogaClass = new YogaClass(req.body);
        await yogaClass.save();
        res.status(201).json(yogaClass);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách Class Instances
app.get('/class-instances', async (req, res) => {
    try {
        const instances = await ClassInstance.find();
        res.status(200).json(instances);
    } catch (err) {
        console.error('Error fetching class instances:', err);
        res.status(500).json({ error: err.message });
    }
});

// Thêm Class Instance mới
app.post('/class-instances', async (req, res) => {
    try {
        const instance = new ClassInstance(req.body);
        await instance.save();
        res.status(201).json(instance);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
