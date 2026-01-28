import { createRouter, createWebHistory } from 'vue-router';
import ExamPaper from './components/ExamPaper.vue';
import TeacherPanel from './components/TeacherPanel.vue';



const routes = [
    { path: '/', component: ExamPaper },
    { path: '/admin', component: TeacherPanel }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;