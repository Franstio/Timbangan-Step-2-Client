
import React, { Fragment,useState,useEffect } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import axios from "axios";
import io from 'socket.io-client';
const apiClient = axios.create({
    withCredentials:false
});

const Home = () => {
    const [hostname, setHostname] = useState('');
    const [socket, setSocket] = useState(io(`http://PCS.local:5000/`)); // Sesuaikan dengan alamat server
    const [Getweightbin, setGetweightbin] = useState("");
    const navigation = [
        { name: 'Dashboard', href: '#', current: true },
        { name: 'Calculation', href: '#', current: false }
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    useEffect(() => {
        axios.get('http://localhost:5000/hostname',{withCredentials:false})
          .then(response => {
            
            setHostname(response.data.hostname);
          })
          .catch(error => {
            console.error('Error fetching the hostname:', error);
          });
      }, []);
      useEffect(()=>{
        console.log("Get Bin For "+hostname);
        if (hostname && hostname != '')
        socket.emit('getWeightBin',hostname);
      },[hostname]);
      useEffect(() => {
        /*socket.on('connect', ()=>{
            console.log("LAUNCH CONNECT " + hostname);
            socket.emit('getWeightBin',hostname);
        });*/
        socket.on('getweight', (data) => {
            console.log(data);
            if (data.weight)
                setGetweightbin(data);
            else
                console.log(data.error);
        });
    }, []);

    async function sendLockBottom() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/lockBottom/`, {
                idLockBottom: 1
            });
            //setinstruksimsg("buka pintu atas");
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleSubmit = () => {
        sendLockBottom();
    }

    return (
        <main>
        
            <div className='bg-gray-400 p-5'>
                <div class="flex justify-center gap-10">
                    <div className='flex-1 p-4 border rounded bg-white'>
                    <h1 className='text-center text-blue-600 font-semibold'>Weight</h1>
                    <div class='flex justify-warp'>
                        <div class='flex-1 p-4 border rounded bg-gray-300 text-center text-5xl font-semibold max-w-xl'>{Getweightbin.weight}</div>
                        <p className='flex items-center text-2xl font-bold'>Kg</p>
                    </div>
                    </div>

                    <div className='flex-1 p-4 border rounded max-w-md bg-white'>
                        <h1 className='text-center text-blue-600 font-semibold'>Status</h1>

                        <div className='flex justify-between'>
                            <p className=''>Green</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'green' }} />
                        </div>
                        <div className='flex justify-between'>
                            <p>Yellow</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'red' }} />
                        </div>
                        <div className='flex justify-between'>
                            <p>Red</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'red' }} />
                        </div>
                    </div>
                </div>

                <div class="flex justify-center gap-10 mt-10">
                    <div className='flex-1 p-4 border rounded bg-white'>
                        <h1 className='font-semibold text-blue-600 text-center'>Sensor Status</h1>
                        <div className='flex justify-between'>
                            <p className=''>Top</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'red' }} />
                        </div>

                        <div className='flex justify-between'>
                            <p>Bottom</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'green' }} />
                        </div>
                    </div>
                    <div className='flex-1 p-4 border rounded max-w-md bg-white'>
                        <h1 className='text-center font-semibold text-blue-600'>Lock Status</h1>

                        <div className='flex justify-between'>
                            <p className=''>Top</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'green' }} />
                        </div>

                        <div className='flex justify-between'>
                            <p>Bottom</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: 'red' }} />
                        </div>
                    </div>

                    <button className='flex-1 p-4 border rounded max-w-xs flex justify-center items-center bg-white font-semibold' onClick={handleSubmit}>Lock Bottom
                    </button>
                </div>
                {/*  <footer className='flex-1 rounded border mt-10 flex justify-center gap-40 p-3 bg-white'  >
                    <p>Server Status: 192.168.1.5 Online</p>
                    <p>Status PLC : Online</p>
                </footer> */}
            </div>
            <footer className='flex-1 rounded border flex justify-center gap-40 p-3 bg-white'  >
                <p>Server Status: 192.168.1.5 Online</p>
                <p>Status PLC : Online</p>
            </footer>
        </main>
    );
};

export default Home;
