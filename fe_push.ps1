$desc = Get-Content mr_desc.txt -Raw
git reset HEAD~2
git add src/services/cinemaRoomService.js src/services/movieService.js
git commit -m "[Feature] Integrate REST APIs for Cinema Room and Movie management in service layer"
git add src/pages/admin/cinema-rooms/CinemaRoomListPage.jsx
git commit -m "[Feature] Implement Cinema Room Listing and Creation UI with Backend API mapping"
git add src/pages/admin/cinema-rooms/CinemaRoomDetailPage.jsx src/pages/admin/cinema-rooms/components/SeatLayoutBuilder.jsx
git commit -m "[Feature] Implement Cinema Room Seat Layout UI binding with Backend API"
git push origin features/Implementation_CinemaRoomCRUD --force -o merge_request.create -o merge_request.target=main -o merge_request.title="[Feature] Implement Cinema Room CRUD" -o merge_request.description="$desc"
