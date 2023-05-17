import { createRouter, createWebHashHistory } from 'vue-router'
// 路由 => 路径和组件之间的对应关系
const routes = [
    {
        path: '/cw',
        component: () => import('../views/cw_mass.vue')
    },
    {
        path: '/ne',
        component: () => import('../views/ne_mass.vue')
    },
    {
        path: '/no',
        component: () => import('../views/no_mass.vue')
    },
    {
        path: '/nw',
        component: () => import('../views/nw_mass.vue')
    },
    {
        path: '/se',
        component: () => import('../views/se_mass.vue')
    },
    {
        path: '/sw',
        component: () => import('../views/sw_mass.vue')
    }, 
    {
        path: '/greenland',
        component: () => import('../views/greenland_mass.vue')
    },
]

const router = createRouter({
    history: createWebHashHistory(), // 路径格式
    routes: routes // 路由数组
})

export default router