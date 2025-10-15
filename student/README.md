# Student Portal - AlamaIT Accommodation Management

This is a student-facing portal for browsing and applying to student accommodation at AlamaIT.

## Features

- **Room Browser**: Browse available rooms across different boarding houses
- **Room Details**: View detailed information about specific rooms including amenities and bed availability
- **Bed Selection**: Select specific beds with individual pricing
- **Application Form**: Submit applications for selected accommodation
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
student/src/
├── components/
│   ├── RoomCard.jsx      # Room display component
│   └── BedCard.jsx       # Bed selection component
├── context/
│   └── StudentContext.jsx # React context for state management
├── pages/
│   ├── StudentPortalLanding.jsx  # Landing page
│   ├── ApplicationForm.jsx       # Application form
│   └── rooms/
│       ├── RoomBrowser.jsx      # Room listing page
│       └── RoomDetails.jsx      # Room details page
├── App.jsx               # Main app component with routing
└── main.jsx             # Entry point
```

## Sample Data

The application uses sample data for demonstration purposes:

- **6 Sample Rooms** across 2 boarding houses (Belvedere House, St. Kilda House)
- **Different room types**: Single, Double, Triple, Quad occupancy
- **Individual bed pricing** ranging from $120-$200 per month
- **Various amenities**: Private/shared bathrooms, air conditioning, study desks, etc.

## Routes

- `/` - Landing page
- `/rooms` - Room browser
- `/rooms/:id` - Room details with bed selection
- `/apply` - Application form (with room/bed parameters)

## Dependencies Used

- React Router for navigation
- Heroicons for UI icons
- Tailwind CSS for styling (assumed to be available)

## Getting Started

1. Install dependencies:
   ```bash
   npm install react-router-dom @heroicons/react
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to view the student portal

## Features Overview

### Landing Page
- Hero section with call-to-action
- Feature highlights
- Statistics display
- How it works section

### Room Browser
- Grid layout of available rooms
- Room availability status
- Pricing information
- Quick access to room details

### Room Details
- Comprehensive room information
- Individual bed selection
- Real-time availability
- Pricing per bed
- Application flow

### Application Form
- Multi-step form with validation
- Personal information
- Academic details
- Emergency contact
- Special requirements
- Application summary

## Sample Room Data

The application includes sample data for:
- Executive Suite (Belvedere House) - $200/month
- Standard Double (St. Kilda House) - $150-180/month
- Economy Quad (Belvedere House) - $120-140/month
- Deluxe Triple (St. Kilda House) - $160-190/month
- Premium Single (Belvedere House) - $180/month
- Budget Double (St. Kilda House) - $130-150/month

Each room has different bed availability and pricing to demonstrate the bed-specific pricing system.