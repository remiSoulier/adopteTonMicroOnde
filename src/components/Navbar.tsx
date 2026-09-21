import LogoutButton from "./LogoutButton";

export default function Navbar() {
  return (
    <div className="flex justify-between card">
      <div className='rounded-full bg-black w-5 h-5'></div>
      <LogoutButton />
    </div>
  )
}

