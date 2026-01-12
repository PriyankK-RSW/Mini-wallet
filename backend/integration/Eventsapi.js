exports.getEvents = async () => {
    const i = Math.floor(Math.random() * 1000);
    
  return [
    {
      id: "evt001",
      name: "Campus Music Fest",
      price: Math.floor(Math.random() * 150) + 800,
      description: "Live music performances by students",
      image: `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`

    },
    {
      id: "evt002",
      name: "Tech Hackathon",
      price: Math.floor(Math.random() * 150) + 800,
      description: "24-hour coding challenge",
      image: `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`
    },
    {
      id: "evt003",
      name: "Startup Talk",
      price: Math.floor(Math.random() * 150) + 800,
      description: "Founders share real startup journeys",
     image: `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`

    },
    {
      id: "evt004",
      name: "Sports Day",
      price: Math.floor(Math.random() * 150) + 800,
      description: "Inter-department sports competition",
      image: `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`
    } , 
    {
      id: "evt005",
      name: "Sports Day",
      price: Math.floor(Math.random() * 150) + 800,
      description: "Inter-department sports competition",
      image: `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`
    }
  ];
};
