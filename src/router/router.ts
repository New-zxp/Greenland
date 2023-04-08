import { createRouter, createWebHashHistory } from 'vue-router'
// 路由 => 路径和组件之间的对应关系
const routes = [
    {
        path: '/cw',
        component: () => import('../components/cw_mass.vue')
    },
    {
        path: '/ne',
        component: () => import('../components/ne_mass.vue')
    },
    {
        path: '/no',
        component: () => import('../components/no_mass.vue')
    },
    {
        path: '/nw',
        component: () => import('../components/nw_mass.vue')
    },
    {
        path: '/se',
        component: () => import('../components/se_mass.vue')
    },
    {
        path: '/sw',
        component: () => import('../components/sw_mass.vue')
    }, 
    {
        path: '/greenland',
        component: () => import('../components/greenland_mass.vue')
    },
    {
        path: '/GraceVel',
        component: () => import('../components/GraceVel.vue')
    },
    {
        path: '/ERate',
        component: () => import('../components/ERate.vue')
    },
    {
        path: '/RRate',
        component: () => import('../components/RRate.vue')
    },
    {
        path: '/SMBRate',
        component: () => import('../components/SMBRate.vue')
    },
    {
        path: '/PRate',
        component: () => import('../components/PRate.vue')
    },
]

const router = createRouter({
    history: createWebHashHistory(), // 路径格式
    routes: routes // 路由数组
})

export default router