# Ứng dụng Quản lý Chi tiêu Cá nhân (Expense Tracker) - K8s Cluster

Bài tập giữa kỳ học phần Điện toán đám mây / CKA 2026. Dự án đóng gói ứng dụng Web (React + Vite + Nginx Frontend, Node.js/Express Backend, PostgreSQL Database) bằng Docker và triển khai trên cụm Kubernetes Multi-node (1 Control Plane, 2 Worker Nodes).

- **Tên miền truy cập trực tuyến (Cloudflare Tunnel):** https://expensetrackergroup12.com
- **Docker Hub Registry:**
  - Frontend: `hoanggiahuy/expense-frontend` (tags: `v1`, `v2`, `v4`, `v5`)
  - Backend: `hoanggiahuy/expense-backend` (tags: `v1`, `v2`)

---

## 1. Cấu trúc thư mục

```text
project-cloud-expense/
├── backend/                # Mã nguồn Backend (Node.js/Express) & Dockerfile
├── frontend/               # Mã nguồn Frontend (React/Vite + Nginx) & Dockerfile
├── k8s/                    # Các file manifest khai báo tài nguyên Kubernetes
│   ├── 00-namespace.yaml   # Khởi tạo Namespace 'expense'
│   ├── 01-postgres.yaml    # Secret, PV, PVC, Deployment & ClusterIP Service cho PostgreSQL
│   ├── 02-backend.yaml     # Deployment (2 replicas) & ClusterIP Service cho Backend
│   └── 03-frontend.yaml    # Deployment (2 replicas) & NodePort Service (30080) cho Frontend
├── docs/                   # Đề cương Báo cáo và Slide thuyết trình
└── docker-compose.yml      # Chạy thử nghiệm cục bộ với Docker Compose
