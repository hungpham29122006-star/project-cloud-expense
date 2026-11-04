# Dàn ý báo cáo PDF (≤ 10 trang)
1. **Giới thiệu** (0,5 tr): đề tài quản lý chi tiêu cá nhân, mục tiêu, phân công 5 thành viên.
2. **Kiến trúc & sơ đồ cluster** (1,5 tr): 3 VM (cp/worker1/worker2), CNI Flannel, Pod → Service → NodePort; bảng IP/cấu hình VM/phiên bản K8s.
3. **Docker** (1,5 tr): 2 Dockerfile (multi-stage cho frontend, alpine, USER node, ARG version). Ảnh: `docker images`, Docker Hub có tag v1/v2.
4. **Cluster kubeadm** (1,5 tr): các bước (swapoff, containerd, kubeadm init/join, Flannel). Ảnh: `kubectl get nodes` 3 Ready.
5. **Triển khai** (1,5 tr): namespace, Deployment 2 replicas, topologySpreadConstraints, Service NodePort, Secret, PVC, probe. Ảnh: `get pods -o wide`, giao diện web.
6. **Vận hành** (2 tr):
   - Scale 4 replicas (ảnh trước/sau).
   - Rolling update v1→v2 (`rollout status`, `/api/info`, `/version.txt`), `rollout undo`.
   - **Tắt worker2:** (a) kubelet ngừng heartbeat, sau ~40s node thành `NotReady` và bị gắn taint `unreachable`; (b) Pod trên node đó bị loại khỏi Endpoints của Service nên traffic chỉ đến Pod ở worker1, ứng dụng vẫn phục vụ (có thể lỗi thoáng qua; NodePort trên IP worker2 không truy cập được); (c) sau `tolerationSeconds` (30s trong YAML, mặc định 300s) Pod bị evict; (d) ReplicaSet tạo Pod mới, scheduler đặt lên worker1 (do `ScheduleAnyway`); (e) bật lại worker2 → node Ready nhưng Pod không tự cân bằng lại. Postgres ở worker1 nên dữ liệu an toàn; tắt worker1 thì DB ngừng (SPOF) – nêu hướng cải thiện.
7. **Khó khăn & bài học** (0,5 tr): firewall/security group, swap, cgroup driver, ImagePullBackOff, VITE_API_URL gắn lúc build, tên node khớp PV.
8. **Kết luận & hướng phát triển** (0,25 tr): Ingress + TLS, HPA, StatefulSet/managed DB, CI/CD, monitoring.
