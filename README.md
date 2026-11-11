# Nhóm 12
# Ứng dụng Quản lý Chi tiêu Cá nhân (Expense Tracker) - Kubernetes Cluster

Bài tập giữa kỳ: Triển khai ứng dụng web với Docker và Kubernetes.
Dự án đóng gói ứng dụng Web Quản lý Chi tiêu (Frontend React/Vite + Nginx, Backend Node.js/Express, CSDL PostgreSQL) bằng Docker và triển khai trên cụm Kubernetes gồm 1 Control Plane và 2 Worker Nodes.

- Docker Hub Registry:
  + Frontend: hoanggiahuy/expense-frontend (tags: v1, v2)
  + Backend: hoanggiahuy/expense-backend (tags: v1, v2)

---

## 1. Cấu trúc thư mục dự án

project-cloud-expense/

├── backend/                # Mã nguồn Backend (Node.js/Express) & Dockerfile

├── frontend/               # Mã nguồn Frontend (React/Vite + Nginx) & Dockerfile

├── k8s/                    # Các file YAML khai báo tài nguyên Kubernetes

│         ├── 00-namespace.yaml   # Khởi tạo Namespace 'expense'

│         ├── 01-postgres.yaml    # Secret, PV, PVC, Deployment & ClusterIP Service cho PostgreSQL

│         ├── 02-backend.yaml     # Deployment (2 replicas) & ClusterIP Service (8080) cho Backend

│         └── 03-frontend.yaml    # Deployment (2 replicas) & NodePort Service (30080) cho Frontend

├── docs/                   # Đề cương Báo cáo và Slide thuyết trình

└── docker-compose.yml      # Cấu hình chạy thử nghiệm cục bộ với Docker Compose

---

## 2. Đóng gói ứng dụng bằng Docker & Đẩy lên Docker Hub (Yêu cầu 1)

2.1. Build và push Backend image (gắn tag phiên bản cụ thể, không dùng latest):

  cd backend
  
  docker build -t hoanggiahuy/expense-backend:v1 .
  
  docker push hoanggiahuy/expense-backend:v1

2.2. Build và push Frontend image (gắn tag phiên bản cụ thể, không dùng latest):

  cd ../frontend
  
  docker build -t hoanggiahuy/expense-frontend:v1 .
  
  docker push hoanggiahuy/expense-frontend:v1

---

## 3. Hạ tầng Cụm Kubernetes (Yêu cầu 2)

Cụm Kubernetes gồm 1 Control Plane và 2 Worker Nodes được cài đặt bằng kubeadm và CNI plugin Flannel trên Ubuntu 24.04 LTS:
- cp (Control Plane): 10.97.0.118
- worker1 (Worker Node 1): 10.97.0.125
- worker2 (Worker Node 2): 10.97.0.6

Kiểm tra trạng thái 3 node ở trạng thái Ready:
  kubectl get nodes -o wide

---

## 4. Hướng dẫn Triển khai Ứng dụng lên Kubernetes (Yêu cầu 3)

Bước 1: Clone repository về node Control Plane (cp):
  git clone https://github.com/hungpham29122006-star/project-cloud-expense.git
  cd project-cloud-expense

Bước 2: Triển khai toàn bộ tài nguyên (Namespace, Secret, PV/PVC, Deployment, Service) bằng lệnh kubectl apply:
  kubectl apply -f k8s/

Bước 3: Kiểm tra trạng thái các Pods (phân bố trên cả 2 worker node) và Services trong namespace 'expense':
  kubectl get pods,svc,pvc -n expense -o wide

Bước 4: Truy cập ứng dụng từ trình duyệt qua Service NodePort (30080):
  - http://10.97.0.118:30080
  - http://10.97.0.125:30080
  - http://10.97.0.6:30080

---

## 5. Vận hành trên Kubernetes (Yêu cầu 4)

5.1. Scale một Deployment lên 4 Replicas:

  kubectl scale deployment frontend --replicas=4 -n expense
  
  kubectl get pods -n expense -o wide

5.2. Cập nhật ứng dụng lên phiên bản mới (v2) và Rollback về phiên bản cũ (v1):
  # Cập nhật image frontend từ v1 lên v2
  
  kubectl set image deployment/frontend frontend=hoanggiahuy/expense-frontend:v2 -n expense
  
  kubectl rollout status deployment/frontend -n expense

  # Rollback về phiên bản v1 trước đó
  
  kubectl rollout undo deployment/frontend -n expense
  
  kubectl rollout status deployment/frontend -n expense
  
  kubectl rollout history deployment/frontend -n expense

5.3. Thử nghiệm tắt một Worker Node, quan sát và giải thích:
  # Tắt máy ảo worker2
  multipass stop worker2

  # Quan sát trạng thái Node và sự dịch chuyển của các Pod
  
  kubectl get nodes
  
  kubectl get pods -n expense -o wide

  # Giải thích hiện tượng:
  - Khi tắt worker2, sau khoảng 40 giây không nhận được tín hiệu heartbeat từ kubelet, Control Plane chuyển trạng thái của worker2 sang NotReady.
  - Nhờ cấu hình tolerations (tolerationSeconds: 30) cho trạng thái node.kubernetes.io/not-ready và unreachable trong file YAML, Kubernetes tự động trục xuất (evict) các Pod trên worker2 và khởi tạo (reschedule) các Pod mới sang worker1 chỉ sau 30 giây (thay vì 300 giây mặc định).
  - Trong suốt quá trình worker2 bị tắt, Service vẫn tự động định tuyến lưu lượng sang các Pod đang Running trên worker1, giúp ứng dụng hoạt động bình thường mà không bị gián đoạn.
