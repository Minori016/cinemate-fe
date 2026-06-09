// Mock movie service
interface Movie {
  id: number
  movieNameVn: string
  version: string
  smallImage?: string
}

interface MoviesResponse {
  data: Movie[]
}

export const movieService = {
  async getAll(): Promise<MoviesResponse> {
    // Mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            {
              id: 1,
              movieNameVn: 'Avengers: Endgame',
              version: '2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop'
            },
            {
              id: 2,
              movieNameVn: 'Spider-Man: No Way Home',
              version: '2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop'
            },
            {
              id: 3,
              movieNameVn: 'The Batman',
              version: 'IMAX 2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop'
            },
            {
              id: 4,
              movieNameVn: 'Doctor Strange',
              version: '3D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop'
            },
            {
              id: 5,
              movieNameVn: 'Top Gun: Maverick',
              version: '2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop'
            },
            {
              id: 6,
              movieNameVn: 'Jurassic World',
              version: '3D Lồng tiếng',
              smallImage: 'https://images.unsplash.com/photo-1574267432644-f74f8ec45dbd?w=400&h=600&fit=crop'
            },
            {
              id: 7,
              movieNameVn: 'Black Panther',
              version: '2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop'
            },
            {
              id: 8,
              movieNameVn: 'Inception',
              version: 'IMAX 2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop'
            },
            {
              id: 9,
              movieNameVn: 'Interstellar',
              version: 'IMAX 2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop'
            },
            {
              id: 10,
              movieNameVn: 'Dune',
              version: 'IMAX 2D Phụ đề',
              smallImage: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400&h=600&fit=crop'
            }
          ]
        })
      }, 500)
    })
  }
}
