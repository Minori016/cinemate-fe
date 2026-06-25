$desc = Get-Content ../cinemate-fe/mr_desc.txt -Raw
cd ../cinemate
git reset HEAD~1
git add cinemate/src/main/java/com/cinema/cinemate/entity/Seat.java cinemate/src/main/java/com/cinema/cinemate/entity/CinemaRoom.java cinemate/src/main/java/com/cinema/cinemate/enums/SeatType.java cinemate/src/main/java/com/cinema/cinemate/repository/CinemaRepository.java cinemate/src/main/java/com/cinema/cinemate/repository/SeatRepository.java
git commit -m "[Feature] Add Entity and Repository for Seat, Cinema Room, and Cinema"
git add cinemate/src/main/java/com/cinema/cinemate/request/CinemaRoomRequest.java cinemate/src/main/java/com/cinema/cinemate/request/SeatRequest.java cinemate/src/main/java/com/cinema/cinemate/request/UpdateRoomLayoutRequest.java cinemate/src/main/java/com/cinema/cinemate/response/SeatResponse.java
git commit -m "[Feature] Create Data Transfer Objects (DTO) for Cinema Room requests and responses"
git add cinemate/src/main/java/com/cinema/cinemate/service/CinemaRoomService.java
git commit -m "[Feature] Implement Cinema Room Service with CRUD operations and seat layout mapping"
git add cinemate/src/main/java/com/cinema/cinemate/controller/CinemaRoomController.java cinemate/src/main/java/com/cinema/cinemate/controller/AdminCinemaRoomController.java
git commit -m "[Feature] Create Admin and Public REST Controllers for Cinema Room management"
git add cinemate/src/main/java/com/cinema/cinemate/service/MovieService.java cinemate/src/main/java/com/cinema/cinemate/controller/AdminMovieController.java cinemate/src/main/java/com/cinema/cinemate/repository/MovieRepository.java cinemate/src/main/java/com/cinema/cinemate/request/UpdateMovieRequest.java cinemate/src/main/java/com/cinema/cinemate/service/CloudinaryService.java
git commit -m "[Feature] Enhance Movie service to support update operations and Cloudinary image handling"
git add cinemate/src/main/java/com/cinema/cinemate/enums/ErrorCode.java cinemate/src/main/java/com/cinema/cinemate/request/UserRegisterRequest.java cinemate/src/main/java/com/cinema/cinemate/request/ResetPasswordRequest.java cinemate/src/main/java/com/cinema/cinemate/request/ProfileUpdateRequest.java
git commit -m "[Fix] Add missing validation errors and resolve User Registration issues"
git add cinemate/src/main/java/com/cinema/cinemate/configuration/DataInitializer.java update.json
git commit -m "[Refactor] Update data initialization configs"
git push gitlab features/Implementation_CinemaRoomCRUD --force -o merge_request.create -o merge_request.target=main -o merge_request.title="[Feature] Implement Cinema Room CRUD" -o merge_request.description="$desc"
