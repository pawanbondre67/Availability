import WashroomTimer from "./components/WashroomTimer";

function App() {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-teal-700">Washroom Availability</h1>
        <WashroomTimer gender="male" />
        <WashroomTimer gender="female" />
      </div>
    </div>
  );
}

export default App; 