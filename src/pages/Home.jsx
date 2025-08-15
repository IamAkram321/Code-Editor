import React, {useState} from 'react'
import {v4 as uuidV4} from 'uuid'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'


const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success('Created a new room')
  }

  const joinRoom = ()=>{
    if(!roomId || !username){
      toast.error('Room ID and Username are required');
      return;
    }
    //redirect to the editor page with roomId and username
    navigate(`/editor/${roomId}`, {
      state: { username }
    });
  }

  const handleEnter = (e)=>{
      if(e.code === 'Enter'){
        joinRoom();
      }
  }
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-grow px-4">
        
        
        <img src="/icon.png" alt="logo" className="mb-4 w-auto h-auto" />

        {/* Heading */}
        <h4 className="text-xl font-semibold mb-6 text-center">
          Paste invitation ROOM ID
        </h4>

        {/* Form */}
        <div className="flex flex-col w-full max-w-sm bg-gray-800 p-6 rounded-lg shadow-lg">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleEnter}
            placeholder="ROOM ID"
            className="mb-4 px-4 py-2 rounded bg-gray-700 text-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleEnter}
            className="mb-4 px-4 py-2 rounded bg-gray-700 text-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="mb-4 bg-green-600 hover:bg-green-700 text-white font-medium 
                       py-2 px-4 rounded transition duration-200"
                    onClick={joinRoom}
          >
            Join
          </button>

          <span className="text-sm text-gray-400">
            If you don’t have an invitation then create &nbsp;
            <a onClick={createNewRoom} href="" className="text-green-400 hover:underline">
            new room
          </a>
          </span>
          
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-400">
        Built with ❤️ by{" "}
        <a
          href="https://github.com/IamAkram321"
          className="text-blue-400 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          IamAkram
        </a>
      </footer>
    </div>
  )
}

export default Home
