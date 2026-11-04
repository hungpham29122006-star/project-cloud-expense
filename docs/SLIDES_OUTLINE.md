# Thuyết trình 8–10 phút (9 slide)
1. Tiêu đề, thành viên  2. Bài toán & tính năng  3. Kiến trúc/sơ đồ cluster  4. Docker & Docker Hub
5. Cluster kubeadm 3 node Ready  6. Triển khai: namespace, Deployment, Service, Pod trên 2 worker
7. DEMO: dùng web → scale 4 → update v2 → rollback  8. DEMO: tắt worker2 + giải thích  9. Khó khăn, bài học, Q&A

## Câu hỏi hay gặp
- Pod/ReplicaSet/Deployment khác nhau? Service chọn Pod bằng gì (label selector)?
- NodePort hoạt động ra sao, kube-proxy làm gì? Vì sao thực tế dùng Ingress?
- Rolling update (maxSurge/maxUnavailable), rollback dựa vào đâu (ReplicaSet cũ)?
- Vì sao không dùng `latest`? Vì sao DB 1 replica và rủi ro?
- Vì sao Pod không chạy trên control plane (taint)? Vai trò CNI?
- Tắt worker thì bao lâu Pod được tạo lại, vì sao (~40s + tolerationSeconds)?
- Vì sao `VITE_API_URL` để trống và Nginx proxy `/api`?
