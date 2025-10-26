import { BriefcaseIcon, AcademicCapIcon, GlobeAltIcon, ChartBarIcon } from "@heroicons/react/solid"

export default function Drawer() {
  const workPackages = [
    {
      name: "WP1",
      icon: <BriefcaseIcon className="h-6 w-6 text-white" />,
      thumbnail: "/fix.png", // Replace with the actual image path
      action: () => alert("Action for WP1"),
    },
    {
      name: "WP2",
      icon: <AcademicCapIcon className="h-6 w-6 text-white" />,
      thumbnail: "/fix.png", // Replace with the actual image path
      action: () => alert("Action for WP2"),
    },
    {
      name: "WP3",
      icon: <GlobeAltIcon className="h-6 w-6 text-white" />,
      thumbnail: "/fix.png", // Replace with the actual image path
      action: () => alert("Action for WP3"),
    },
    {
      name: "WP4",
      icon: <ChartBarIcon className="h-6 w-6 text-white" />,
      thumbnail: "/fix.png", // Replace with the actual image path
      action: () => alert("Action for WP4"),
    },
  ]

  return (
    <div className="absolute left-0 top-16 bg-gray-50 bg-opacity-80 backdrop-blur-md text-black shadow-lg p-4 h-[calc(100%-64px)] w-64 z-10">
      <h2 className="text-lg font-bold mb-4">Work Packages</h2>
      <div className="space-y-4">
        {workPackages.map((wp, index) => (
          <button
            key={index}
            className="flex items-center gap-4 p-4 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition w-full text-left"
          >
            {/* Thumbnail */}
            <img src={wp.thumbnail} alt={wp.name} className="h-12 w-12 object-cover rounded" />
            {/* Icon and Name */}
            <div className="flex items-center gap-2">
              {wp.icon}
              <span>{wp.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
