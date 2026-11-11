# Ứng dụng Quản lý Chi tiêu Cá nhân (Expense Tracker) - Kubernetes Cluster

Bài tập giữa kỳ học phần Điện toán đám mây / CKA 2026. Dự án đóng gói ứng dụng Web Quản lý Chi tiêu (Frontend React/Vite + Nginx, Backend Node.js/Express, CSDL PostgreSQL) bằng Docker và triển khai trên cụm Kubernetes gồm 1 Control Plane và 2 Worker Nodes.

- Tên miền truy cập trực tuyến (Cloudflare Tunnel): https://expensetrackergroup12.com
- Docker Hub Registry:
  + Frontend: hoanggiahuy/expense-frontend (tags: v1, v2, v4, v5)
  + Backend: hoanggiahuy/expense-backend (tags: v1, v2)

---

## 1. Cấu trúc thư mục dự án

project-cloud-expense/
├── backend/                # Mã nguồn Backend (Node.js/Express) & Dockerfile
├── frontend/               # Mã nguồn Frontend (React/Vite + Nginx) & Dockerfile
├── k8s/                    # Các file YAML khai báo tài nguyên Kubernetes
│   ├── 00-namespace.yaml   # Khởi tạo Namespace 'expense'
│   ├── 01-postgres.yaml    # Secret, PV, PVC, Deployment & ClusterIP Service cho PostgreSQL
│   ├── 02-backend.yaml     # Deployment (2 replicas) & ClusterIP Service cho Backend
│   └── 03-frontend.yaml    # Deployment (2 replicas) & NodePort Service (30080) cho Frontend
├── docs/                   # Đề cương Báo cáo và Slide thuyết trình
└── docker-compose.yml      # Cấu hình chạy thử nghiệm cục bộ với Docker Compose

---

## 2. Đóng gói ứng dụng bằng Docker & Đẩy lên Docker Hub

2.1. Build và push Backend image:
  cd backend
  docker build -t hoanggiahuy/expense-backend:v1 .
  docker push hoanggiahuy/expense-backend:v1

2.2. Build và push Frontend image:
  cd ../frontend
  docker build -t hoanggiahuy/expense-frontend:v1 .
  docker push hoanggiahuy/expense-frontend:v1

---

## 3. Hạ tầng Cụm Kubernetes (1 Control Plane + 2 Worker Nodes)

Cụm Kubernetes được dựng trên 3 máy ảo Ubuntu 24.04 LTS bằng kubeadm và CNI plugin Flannel:
- cp (Control Plane): 10.97.0.118
- worker1 (Worker Node 1): 10.97.0.125
- worker2 (Worker Node 2): 10.97.0.6

Kiểm tra trạng thái các node trong cụm:
  kubectl get nodes -o wide

---

## 4. Hướng dẫn Triển khai Ứng dụng lên Kubernetes

Bước 1: Clone repository về node Control Plane (cp):
  git clone https://github.com/hungpham29122006-star/project-cloud-expense.git
  cd project-cloud-expense

Bước 2: Áp dụng toàn bộ các file cấu hình YAML trong thư mục k8s/:
  kubectl apply -f k8s/

Bước 3: Kiểm tra trạng thái các Pods, Services và PVC trong namespace 'expense':
  kubectl get all,pvc -n expense -o wide

Bước 4: Truy cập ứng dụng:
  - Qua mạng nội bộ (NodePort): http://10.97.0.125:30080 hoặc http://10.97.0.6:30080
  - Qua Internet (Cloudflare Tunnel): https://expensetrackergroup12.com

---

## 5. Kịch bản Vận hành trên Kubernetes (Operations)

5.1. Scale Deployment lên 4 Replicas:
  kubectl scale deployment frontend --replicas=4 -n expense
  kubectl get pods -n expense -o wide

5.2. Cập nhật ứng dụng (Rolling Update lên v2) và Rollback về v1:
  # Cập nhật image frontend từ v1 lên v2
  kubectl set image deployment/frontend frontend=hoanggiahuy/expense-frontend:v2 -n expense
  kubectl rollout status deployment/frontend -n expense

  # Rollback về phiên bản v1 ban đầu
  kubectl rollout undo deployment/frontend -n expense
  kubectl rollout status deployment/frontend -n expense
  kubectl rollout history deployment/frontend -n expense

5.3. Thử nghiệm tắt một Worker Node (Failover Test):
  - Tắt máy ảo worker2: multipass stop worker2
  - Quan sát trạng thái Node và Pod:
    kubectl get nodes
    kubectl get pods -n expense -o wide
  - Giải thích: Sau khoảng 40s, worker2 chuyển sang trạng thái NotReady. Nhờ cấu hình tolerations (tolerationSeconds: 30) trong file YAML, Kubernetes tự động trục xuất (evict) các Pod trên worker2 và khởi tạo lại trên worker1 chỉ sau 30 giây (thay vì 300 giây mặc định), đảm bảo ứng dụng hoạt động liên tục không gián đoạn.
