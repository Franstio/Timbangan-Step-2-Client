
import React, { Fragment, useState, useEffect } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import axios from "axios";
import io from 'socket.io-client';
import GaugeComponent from 'react-gauge-component'
const apiClient = axios.create({
    withCredentials: false
});
const Home = () => {
    const [hostname, setHostname] = useState('');
    const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);
    const [socket, setSocket] = useState(); // Sesuaikan dengan alamat server
    const [Getweightbin, setGetweightbin] = useState(0);
    const [instruksimsg, setinstruksimsg] = useState("");
    const [localSocket,setLocalSocket] = useState();
    const navigation = [
        { name: 'Dashboard', href: '#', current: true },
        { name: 'Calculation', href: '#', current: false }
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }
    useEffect(()=>{
        setSocket(io('http://localhost:5000/'));
        setLocalSocket(io(`http://PCS.local:5000/`));
    },[])
    useEffect(()=>{
        if (!localSocket)
            return;
        localSocket.on('UpdateInstruksi',(instruksi)=>{
                setinstruksimsg(instruksi);
        });
    },[localSocket]);
    useEffect(() => {
        axios.get('http://localhost:5000/hostname', { withCredentials: false })
            .then(response => {

                setHostname(response.data.hostname);
            })
            .catch(error => {
                console.error('Error fetching the hostname:', error);
            });
    }, []);
    useEffect(() => {
        if (!socket)
            return;
        console.log("Get Bin For " + hostname);
        if (hostname && hostname != '')
            socket.emit('getWeightBin', hostname);
    }, [hostname,socket]);
    useEffect(() => {
        /*socket.on('connect', ()=>{
            console.log("LAUNCH CONNECT " + hostname);
            socket.emit('getWeightBin',hostname);
        });*/
        if (!socket)
            return;
        socket.on('getweight', (data) => {
//            console.log(["Input", data]);
            setGetweightbin(prev => data.weight);
        });
    }, [socket]);

    async function sendLockBottom() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/lockBottom/`, {
                idLockBottom: 1
            });
            new Promise(async () => {
                //await sendGreenlampOff();
                await sendYellowOn();
                Promise.resolve();
            })
            setinstruksimsg("buka penutup bawah");
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const readSensorBottom = async () => {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/sensorbottom`, {
                SensorBottomId: 1
            });
            if (response.status !== 200) {
                console.log(response);
                return;
            }
    
            const sensorData = response.data.sensorBottom; // Ambil data sensor dari respons
    
            // Konversi nilai sensor menjadi bentuk boolean
             return  sensorData == 1; 
    
            //console.log("Sensor value:", sensorValue);
        } catch (error) {
            console.error(error);
            return {error:error};
        }
    };

    async function sendGreenlampOff() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/greenlampoff/`, {
                idLampGreen: 1
            });
            //setinstruksimsg("buka pintu atas");
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function sendYellowOn() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/yellowlampon/`, {
                idLampYellow: 1
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

    
      // Menghitung nilai gaugeValue sesuai dengan aturan yang ditentukan
      const getGaugeValue = () => {
        if (Getweightbin >= 100) {
            return 100; // Jika Getweightbin mencapai atau melebihi 400 kg, set gaugeValue menjadi 100
        } else {
            return (Getweightbin / 1); // Jika tidak, hitung 25% dari Getweightbin
        }
    };

    const gaugeValue = getGaugeValue(); // Dapatkan nilai GaugeComponent yang sesuai
    return (
        <main>

            <div className='bg-gray-400 p-5'>
                <div class="flex justify-center gap-10">
                    <div className='flex-1 p-4 border rounded bg-white'>
                        <h1 className='text-center text-blue-600 font-semibold'>Weight</h1>
                        <div className='flex justify-center'>
                            <GaugeComponent
                                arc={{

                                    subArcs: [
                                        {
                                            limit: 20,
                                            color: 'GREEN',
                                            showTick: true
                                        },
                                        {
                                            limit: 50,
                                            color: 'YELLOW',
                                            showTick: true
                                        },
                                        {
                                            limit: 80,
                                            color: 'YELLOW',
                                            showTick: true
                                        },
                                        {
                                            limit: 81,
                                            color: 'RED',
                                            showTick: true
                                        },
                                    ]
                                }}
                                value={gaugeValue}
                                style={{ width: '100%', height: '20%' }} // Ensure the gauge fits the container
                            />

                        </div>
                        <p className='flex justify-center'>{Getweightbin}Kg</p>
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
                    <p>instruksi: {instruksimsg}</p>
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
