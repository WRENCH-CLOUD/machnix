(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/machanix/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/machanix/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Demo users for testing
const demoUsers = {
    "frontdesk@mechanix.com": {
        id: "u1",
        name: "Priya Desai",
        email: "frontdesk@mechanix.com",
        phone: "+91 99887 76543",
        role: "frontdesk",
        avatar: "/professional-indian-woman-portrait.png",
        tenantId: "t1",
        tenantName: "Garage A",
        password: "demo123"
    },
    "mechanic@mechanix.com": {
        id: "u2",
        name: "Ravi Kumar",
        email: "mechanic@mechanix.com",
        phone: "+91 98765 43210",
        role: "mechanic",
        avatar: "/indian-male-mechanic-portrait.jpg",
        tenantId: "t1",
        tenantName: "Garage A",
        password: "demo123"
    },
    "admin@mechanix.com": {
        id: "u3",
        name: "Vikram Admin",
        email: "admin@mechanix.com",
        phone: "+91 88776 65432",
        role: "admin",
        avatar: "/professional-indian-businessman-portrait.png",
        password: "admin123"
    },
    "+91 99887 76543": {
        id: "u1",
        name: "Priya Desai",
        email: "frontdesk@mechanix.com",
        phone: "+91 99887 76543",
        role: "frontdesk",
        avatar: "/professional-indian-woman-portrait.png",
        tenantId: "t1",
        tenantName: "Garage A",
        password: "demo123"
    },
    "+91 98765 43210": {
        id: "u2",
        name: "Ravi Kumar",
        email: "mechanic@mechanix.com",
        phone: "+91 98765 43210",
        role: "mechanic",
        avatar: "/indian-male-mechanic-portrait.jpg",
        tenantId: "t1",
        tenantName: "Garage A",
        password: "demo123"
    }
};
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[login]": async (emailOrPhone, password)=>{
            setIsLoading(true);
            // Simulate API delay
            await new Promise({
                "AuthProvider.useCallback[login]": (resolve)=>setTimeout(resolve, 800)
            }["AuthProvider.useCallback[login]"]);
            const normalizedInput = emailOrPhone.toLowerCase().trim();
            const demoUser = demoUsers[normalizedInput];
            if (demoUser && demoUser.password === password) {
                const { password: _, ...userWithoutPassword } = demoUser;
                setUser(userWithoutPassword);
                setIsLoading(false);
                return {
                    success: true
                };
            }
            setIsLoading(false);
            return {
                success: false,
                error: "Invalid credentials. Try demo accounts listed below."
            };
        }
    }["AuthProvider.useCallback[login]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[logout]": ()=>{
            setUser(null);
        }
    }["AuthProvider.useCallback[logout]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            isAuthenticated: !!user,
            login,
            logout,
            isLoading
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/machanix/lib/auth-context.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "GTS8VTQTfjiY2UIthsijiNpONXg=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/machanix/lib/mock-data.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dviTemplates",
    ()=>dviTemplates,
    "mechanics",
    ()=>mechanics,
    "mockJobs",
    ()=>mockJobs,
    "statusConfig",
    ()=>statusConfig
]);
const mechanics = [
    {
        id: "m1",
        name: "Ravi Kumar",
        avatar: "/indian-male-mechanic-portrait.jpg",
        specialty: "Engine Specialist",
        phone: "+91 98765 43210"
    },
    {
        id: "m2",
        name: "Suresh Patel",
        avatar: "/indian-male-auto-technician-portrait.jpg",
        specialty: "Electrical Systems",
        phone: "+91 98765 43211"
    },
    {
        id: "m3",
        name: "Amit Singh",
        avatar: "/indian-male-car-mechanic-portrait.jpg",
        specialty: "Brake & Suspension",
        phone: "+91 98765 43212"
    },
    {
        id: "m4",
        name: "Deepak Sharma",
        avatar: "/indian-male-auto-repair-technician-portrait.jpg",
        specialty: "General Repairs",
        phone: "+91 98765 43213"
    }
];
const dviTemplates = [
    {
        id: "full",
        name: "Full Vehicle Inspection",
        itemCount: 42
    },
    {
        id: "quick",
        name: "Quick Service Check",
        itemCount: 15
    },
    {
        id: "brake",
        name: "Brake System Inspection",
        itemCount: 18
    },
    {
        id: "ac",
        name: "A/C System Check",
        itemCount: 12
    },
    {
        id: "pre-purchase",
        name: "Pre-Purchase Inspection",
        itemCount: 55
    }
];
const mockJobs = [
    {
        id: "j1",
        jobNumber: "JOB-2024-001",
        customer: {
            id: "c1",
            name: "Rajesh Verma",
            phone: "+91 99887 76543",
            email: "rajesh.v@email.com",
            address: "42, MG Road, Bangalore"
        },
        vehicle: {
            id: "v1",
            make: "Toyota",
            model: "Camry",
            year: 2021,
            regNo: "KA 01 AB 1234",
            color: "Silver"
        },
        mechanic: mechanics[0],
        status: "working",
        dviPending: true,
        dviTemplate: "Full Vehicle Inspection",
        dviItems: [
            {
                id: "d1",
                category: "Brakes",
                name: "Front Brake Pads",
                status: "urgent",
                note: "Worn to 15%, needs immediate replacement"
            },
            {
                id: "d2",
                category: "Brakes",
                name: "Rear Brake Pads",
                status: "attention",
                note: "At 35%, replace within 5000km"
            },
            {
                id: "d3",
                category: "Brakes",
                name: "Brake Fluid Level",
                status: "good"
            },
            {
                id: "d4",
                category: "Engine",
                name: "Engine Oil Level",
                status: "good"
            },
            {
                id: "d5",
                category: "Engine",
                name: "Air Filter",
                status: "attention",
                note: "Slightly dirty, recommend replacement"
            },
            {
                id: "d6",
                category: "Tires",
                name: "Front Left Tire",
                status: "good"
            },
            {
                id: "d7",
                category: "Tires",
                name: "Front Right Tire",
                status: "pending"
            },
            {
                id: "d8",
                category: "Tires",
                name: "Rear Left Tire",
                status: "pending"
            },
            {
                id: "d9",
                category: "Tires",
                name: "Rear Right Tire",
                status: "pending"
            },
            {
                id: "d10",
                category: "Fluids",
                name: "Coolant Level",
                status: "good"
            }
        ],
        parts: [
            {
                id: "p1",
                name: "Front Brake Pads (Set)",
                partNumber: "TYT-BP-001",
                quantity: 1,
                unitPrice: 3500,
                laborCost: 800
            },
            {
                id: "p2",
                name: "Air Filter",
                partNumber: "TYT-AF-042",
                quantity: 1,
                unitPrice: 850,
                laborCost: 200
            }
        ],
        activities: [
            {
                id: "a1",
                timestamp: new Date("2024-01-15T09:00:00"),
                type: "status_change",
                description: "Job created and received",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a2",
                timestamp: new Date("2024-01-15T09:30:00"),
                type: "status_change",
                description: "Assigned to Ravi Kumar",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a3",
                timestamp: new Date("2024-01-15T10:15:00"),
                type: "status_change",
                description: "Status changed to Working",
                user: "Ravi Kumar"
            },
            {
                id: "a4",
                timestamp: new Date("2024-01-15T11:00:00"),
                type: "dvi_update",
                description: "DVI inspection started",
                user: "Ravi Kumar"
            }
        ],
        laborTotal: 1000,
        partsTotal: 4350,
        tax: 963,
        createdAt: new Date("2024-01-15T09:00:00"),
        updatedAt: new Date("2024-01-15T11:00:00"),
        estimatedCompletion: new Date("2024-01-15T16:00:00"),
        complaints: "Squeaking noise from front brakes, A/C not cooling properly"
    },
    {
        id: "j2",
        jobNumber: "JOB-2024-002",
        customer: {
            id: "c2",
            name: "Anita Sharma",
            phone: "+91 88776 65432",
            email: "anita.s@email.com"
        },
        vehicle: {
            id: "v2",
            make: "Honda",
            model: "City",
            year: 2020,
            regNo: "KA 02 CD 5678",
            color: "White"
        },
        mechanic: mechanics[1],
        status: "assigned",
        dviPending: false,
        dviTemplate: "Quick Service Check",
        dviItems: [],
        parts: [],
        activities: [
            {
                id: "a5",
                timestamp: new Date("2024-01-15T10:00:00"),
                type: "status_change",
                description: "Job created and received",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a6",
                timestamp: new Date("2024-01-15T10:30:00"),
                type: "status_change",
                description: "Assigned to Suresh Patel",
                user: "Priya (Frontdesk)"
            }
        ],
        laborTotal: 0,
        partsTotal: 0,
        tax: 0,
        createdAt: new Date("2024-01-15T10:00:00"),
        updatedAt: new Date("2024-01-15T10:30:00"),
        complaints: "Regular service - Oil change and general checkup"
    },
    {
        id: "j3",
        jobNumber: "JOB-2024-003",
        customer: {
            id: "c3",
            name: "Mohammed Khan",
            phone: "+91 77665 54321",
            email: "mkhan@email.com"
        },
        vehicle: {
            id: "v3",
            make: "Maruti",
            model: "Swift",
            year: 2019,
            regNo: "KA 03 EF 9012",
            color: "Red"
        },
        status: "received",
        dviPending: true,
        dviItems: [],
        parts: [],
        activities: [
            {
                id: "a7",
                timestamp: new Date("2024-01-15T11:00:00"),
                type: "status_change",
                description: "Job created and received",
                user: "Priya (Frontdesk)"
            }
        ],
        laborTotal: 0,
        partsTotal: 0,
        tax: 0,
        createdAt: new Date("2024-01-15T11:00:00"),
        updatedAt: new Date("2024-01-15T11:00:00"),
        complaints: "Car not starting, battery seems weak"
    },
    {
        id: "j4",
        jobNumber: "JOB-2024-004",
        customer: {
            id: "c4",
            name: "Priya Nair",
            phone: "+91 66554 43210",
            email: "priya.n@email.com"
        },
        vehicle: {
            id: "v4",
            make: "Hyundai",
            model: "Creta",
            year: 2022,
            regNo: "KA 04 GH 3456",
            color: "Blue"
        },
        mechanic: mechanics[2],
        status: "ready",
        dviPending: false,
        dviTemplate: "Brake System Inspection",
        dviItems: [
            {
                id: "d11",
                category: "Brakes",
                name: "All Brake Components",
                status: "good",
                note: "Replaced and tested"
            }
        ],
        parts: [
            {
                id: "p3",
                name: "Rear Brake Pads (Set)",
                partNumber: "HYD-BP-002",
                quantity: 1,
                unitPrice: 2800,
                laborCost: 600
            },
            {
                id: "p4",
                name: "Brake Disc (Rear)",
                partNumber: "HYD-BD-001",
                quantity: 2,
                unitPrice: 4500,
                laborCost: 1200
            }
        ],
        activities: [
            {
                id: "a8",
                timestamp: new Date("2024-01-14T09:00:00"),
                type: "status_change",
                description: "Job created and received",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a9",
                timestamp: new Date("2024-01-14T09:30:00"),
                type: "status_change",
                description: "Assigned to Amit Singh",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a10",
                timestamp: new Date("2024-01-14T10:00:00"),
                type: "status_change",
                description: "Status changed to Working",
                user: "Amit Singh"
            },
            {
                id: "a11",
                timestamp: new Date("2024-01-15T09:00:00"),
                type: "status_change",
                description: "Status changed to Ready for Payment",
                user: "Amit Singh"
            },
            {
                id: "a12",
                timestamp: new Date("2024-01-15T09:30:00"),
                type: "estimate_sent",
                description: "Estimate sent via WhatsApp",
                user: "Priya (Frontdesk)"
            }
        ],
        laborTotal: 1800,
        partsTotal: 11800,
        tax: 2448,
        createdAt: new Date("2024-01-14T09:00:00"),
        updatedAt: new Date("2024-01-15T09:30:00"),
        complaints: "Grinding noise from rear wheels when braking"
    },
    {
        id: "j5",
        jobNumber: "JOB-2024-005",
        customer: {
            id: "c5",
            name: "Vikram Reddy",
            phone: "+91 55443 32109",
            email: "vikram.r@email.com"
        },
        vehicle: {
            id: "v5",
            make: "Tata",
            model: "Nexon",
            year: 2023,
            regNo: "KA 05 IJ 7890",
            color: "Green"
        },
        mechanic: mechanics[3],
        status: "completed",
        dviPending: false,
        dviTemplate: "Full Vehicle Inspection",
        dviItems: [
            {
                id: "d12",
                category: "General",
                name: "All Systems",
                status: "good",
                note: "Vehicle in excellent condition"
            }
        ],
        parts: [
            {
                id: "p5",
                name: "Engine Oil (5L)",
                partNumber: "GEN-OIL-5W30",
                quantity: 1,
                unitPrice: 2200,
                laborCost: 400
            },
            {
                id: "p6",
                name: "Oil Filter",
                partNumber: "TATA-OF-001",
                quantity: 1,
                unitPrice: 450,
                laborCost: 0
            }
        ],
        activities: [
            {
                id: "a13",
                timestamp: new Date("2024-01-13T09:00:00"),
                type: "status_change",
                description: "Job created and received",
                user: "Priya (Frontdesk)"
            },
            {
                id: "a14",
                timestamp: new Date("2024-01-13T14:00:00"),
                type: "status_change",
                description: "Status changed to Completed",
                user: "Deepak Sharma"
            },
            {
                id: "a15",
                timestamp: new Date("2024-01-13T15:00:00"),
                type: "payment",
                description: "Payment received - Cash ₹3,569",
                user: "Priya (Frontdesk)"
            }
        ],
        laborTotal: 400,
        partsTotal: 2650,
        tax: 549,
        createdAt: new Date("2024-01-13T09:00:00"),
        updatedAt: new Date("2024-01-13T15:00:00"),
        complaints: "Routine service and oil change"
    }
];
const statusConfig = {
    received: {
        label: "Received",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20"
    },
    assigned: {
        label: "Assigned",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20"
    },
    working: {
        label: "Working",
        color: "text-amber-400",
        bgColor: "bg-amber-500/20"
    },
    ready: {
        label: "Ready for Payment",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20"
    },
    completed: {
        label: "Completed",
        color: "text-slate-400",
        bgColor: "bg-slate-500/20"
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/machanix/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MechanixApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/app-sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$top$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/top-header.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$job$2d$board$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/job-board.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$create$2d$job$2d$wizard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/create-job-wizard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$job$2d$details$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/job-details.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$all$2d$jobs$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/all-jobs-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$customers$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/customers-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$vehicles$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/vehicles-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$reports$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/reports-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$login$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/login-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$admin$2d$dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/admin-dashboard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$mechanic$2d$dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/components/mechanix/mechanic-dashboard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/machanix/lib/mock-data.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function AppContent() {
    _s();
    const { isAuthenticated, user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [activeView, setActiveView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("dashboard");
    const [showCreateJob, setShowCreateJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedJob, setSelectedJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Show login page if not authenticated
    if (!isAuthenticated) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$login$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoginPage"], {}, void 0, false, {
            fileName: "[project]/machanix/app/page.tsx",
            lineNumber: 28,
            columnNumber: 12
        }, this);
    }
    if (user?.role === "mechanic") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$mechanic$2d$dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MechanicDashboard"], {}, void 0, false, {
            fileName: "[project]/machanix/app/page.tsx",
            lineNumber: 32,
            columnNumber: 12
        }, this);
    }
    // Show admin dashboard for admin users
    if (user?.role === "admin") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$admin$2d$dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminDashboard"], {}, void 0, false, {
            fileName: "[project]/machanix/app/page.tsx",
            lineNumber: 37,
            columnNumber: 12
        }, this);
    }
    const handleJobClick = (job)=>{
        setSelectedJob(job);
    };
    const handleCreateJob = (data)=>{
        console.log("Creating job:", data);
    };
    // Frontdesk view (default)
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-screen bg-background overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppSidebar"], {
                activeView: activeView,
                onViewChange: setActiveView
            }, void 0, false, {
                fileName: "[project]/machanix/app/page.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$top$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TopHeader"], {
                        tenantName: user?.tenantName || "Garage A",
                        onCreateJob: ()=>setShowCreateJob(true)
                    }, void 0, false, {
                        fileName: "[project]/machanix/app/page.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 overflow-hidden",
                        children: [
                            activeView === "dashboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$job$2d$board$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobBoard"], {
                                jobs: __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockJobs"],
                                onJobClick: handleJobClick,
                                isMechanicMode: false
                            }, void 0, false, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 60,
                                columnNumber: 13
                            }, this),
                            activeView === "jobs" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$all$2d$jobs$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AllJobsView"], {
                                jobs: __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockJobs"],
                                onJobClick: handleJobClick
                            }, void 0, false, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 63,
                                columnNumber: 37
                            }, this),
                            activeView === "customers" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$customers$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CustomersView"], {}, void 0, false, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 65,
                                columnNumber: 42
                            }, this),
                            activeView === "vehicles" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$vehicles$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VehiclesView"], {}, void 0, false, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 67,
                                columnNumber: 41
                            }, this),
                            activeView === "reports" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$reports$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ReportsView"], {}, void 0, false, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 69,
                                columnNumber: 40
                            }, this),
                            activeView === "invoices" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold mb-4",
                                        children: "Invoices"
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-muted-foreground",
                                        children: "Invoice management coming soon..."
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this),
                            activeView === "settings" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold mb-4",
                                        children: "Settings"
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 80,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-muted-foreground",
                                        children: "System settings coming soon..."
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 81,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this),
                            activeView === "help" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold mb-4",
                                        children: "Help & Support"
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 87,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-muted-foreground",
                                        children: "Documentation and support coming soon..."
                                    }, void 0, false, {
                                        fileName: "[project]/machanix/app/page.tsx",
                                        lineNumber: 88,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/machanix/app/page.tsx",
                                lineNumber: 86,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/machanix/app/page.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/machanix/app/page.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: showCreateJob && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$create$2d$job$2d$wizard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CreateJobWizard"], {
                    onClose: ()=>setShowCreateJob(false),
                    onSubmit: handleCreateJob
                }, void 0, false, {
                    fileName: "[project]/machanix/app/page.tsx",
                    lineNumber: 96,
                    columnNumber: 27
                }, this)
            }, void 0, false, {
                fileName: "[project]/machanix/app/page.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: selectedJob && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$components$2f$mechanix$2f$job$2d$details$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JobDetails"], {
                    job: selectedJob,
                    onClose: ()=>setSelectedJob(null),
                    isMechanicMode: false
                }, void 0, false, {
                    fileName: "[project]/machanix/app/page.tsx",
                    lineNumber: 100,
                    columnNumber: 25
                }, this)
            }, void 0, false, {
                fileName: "[project]/machanix/app/page.tsx",
                lineNumber: 99,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/machanix/app/page.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_s(AppContent, "ehpto+ZNT+hthpw+GZ+de1khtFc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = AppContent;
function MechanixApp() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$machanix$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppContent, {}, void 0, false, {
            fileName: "[project]/machanix/app/page.tsx",
            lineNumber: 109,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/machanix/app/page.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}
_c1 = MechanixApp;
var _c, _c1;
__turbopack_context__.k.register(_c, "AppContent");
__turbopack_context__.k.register(_c1, "MechanixApp");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=machanix_65fdfe8d._.js.map