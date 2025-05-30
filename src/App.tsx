import WashroomTimer from "./components/WashroomTimer";

function App() {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Washroom Availability</h1>
        <WashroomTimer gender="male" />
        <WashroomTimer gender="female" />
      </div>
    </div>
  );
}

export default App; 