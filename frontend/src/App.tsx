import { Toaster } from "sonner";
import { CreateEventPage } from "./features/create-event/ui/CreateEventPage";
import ReservationPage from "./features/reservation/ui/ReservationPage";
function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <CreateEventPage />
      <ReservationPage />
    </>
  );
}
export default App;