import { SavedLabsClient } from "./SavedLabsClient";

export const metadata = {
  title: "Saved labs, Microsoft Sandbox",
  description: "The labs you've starred in the Microsoft Sandbox catalog.",
};

export default function SavedPage() {
  return <SavedLabsClient />;
}
