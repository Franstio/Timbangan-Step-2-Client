
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
    const [localSocket, setLocalSocket] = useState();
    const [bottomLockEnable, setBottomLock] = useState(false);
    const [type, setType] = useState('');
    const [processStatus,startProcess] = useState(null);
    const [topProcessStatus,startTopProcess]= useState(null);
    const [final,setFinal] = useState(false);
    const [sensor,setSensor] = useState([0,0]);
    const navigation = [
        { name: 'Dashboard', href: '#', current: true },
        { name: 'Calculation', href: '#', current: false }
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }
    useEffect(() => {
        setSocket(io('http://PCS.local:5000/'));
        setLocalSocket(io(`http://localhost:5000/`));
    }, [])
    useEffect(() => {
        if (!localSocket)
            return;
        localSocket.on('UpdateInstruksi', (instruksi) => {
            console.log(instruksi);
            
            setinstruksimsg(instruksi);
            /*if (instruksi && instruksi != '' && instruksi != null)
            {
            }*/
        });
    }, [localSocket]);
    const startObserveBottomSensor =async (target)=>{
        await apiClient.post('http://localhost:5000/observeBottomSensor',{readTarget:target});

    }
    useEffect(()=>{
        if (processStatus==null)
            return;
        if (processStatus)
        {
            console.log("Waiting for 0");
            startObserveBottomSensor(0);
            localSocket.on('target-0',(res)=>{
                startProcess(false);
                setinstruksimsg("Tutup Penutup Bawah");
                localSocket.off('target-0');
            });

        }
        else
        {
            console.log("Waiting for 1");
            startObserveBottomSensor(1);
            localSocket.on('target-1',(res)=>{
                startProcess(null);
                localSocket.off('target-1');
                if (final)
                {
                    setFinal(false);
                    setinstruksimsg('');
                    return;
                }
                setinstruksimsg("Tekan Tombol Lock");
                setBottomLock(type == 'Collection');

            });
        }
    },[processStatus]);

    const startObserveTopSensor =async (target)=>{
        await apiClient.post('http://localhost:5000/observeTopSensor',{readTargetTop:target});

    }
    useEffect(()=>{
        if (topProcessStatus==null)
            return;
        if (topProcessStatus)
        {
            console.log("Waiting for 0");
            startObserveTopSensor(0);
            localSocket.on('target-top-0',(res)=>{
                startTopProcess(false);
                setinstruksimsg("Tutup Penutup Atas");
                localSocket.off('target-top-0');
            });

        }
        else
        {
            console.log("Waiting for 1");
            startObserveTopSensor(1);
            localSocket.on('target-top-1',(res)=>{
                startTopProcess(null);
                localSocket.off('target-top-1');
                setinstruksimsg('Lakukan Verifikasi');
                /* if (final)
                {
                    setFinal(false);
                    setinstruksimsg('');
                    return;
                }
                setinstruksimsg("Tekan Tombol Lock");
                setBottomLock(type == 'Collection'); */

            });
        }
    },[topProcessStatus]);
    useEffect(() => {
        if (!localSocket)
            return;
        localSocket.on('GetType', (type) => {
            setType(type);
            console.log(type);
            if (type=='Collection')
                startProcess(true);
            else
                startTopProcess(true);
        });
        localSocket.on('sensorUpdate',(data)=>{
            setSensor([data[0],data[1]]);
        });
    }, [localSocket]);
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
    }, [hostname, socket]);
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
            const response = await apiClient.post(`http://localhost:5000/lockBottom`, {
                idLockBottom: 1
            });
            new Promise(async () => {
                await sendGreenlampOff();
                await sendYellowOn();
                Promise.resolve();
            })
            setinstruksimsg("buka penutup bawah");
            setFinal(true);
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const readSensorBottom = async () => {
        try {
            const response = await apiClient.post(`http://localhost:5000/sensorbottom`, {
                SensorBottomId: 1
            });
            if (response.status !== 200) {
                console.log(response);
                return;
            }

            const sensorData = response.data.sensorBottom; // Ambil data sensor dari respons

            // Konversi nilai sensor menjadi bentuk boolean
            return sensorData == 1;

            //console.log("Sensor value:", sensorValue);
        } catch (error) {
            console.error(error);
            return { error: error };
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
        setBottomLock(false);
 //       setinstruksimsg("Buka pintu bawah");
    }
    useEffect(()=>{
        if (final==true)
            startProcess(final);
    },[final])


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
                            <FiberManualRecordIcon fontSize="small" style={{ color: (sensor[0] == 0 ? 'red' : 'green') }} />
                        </div>

                        <div className='flex justify-between'>
                            <p>Bottom</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: (sensor[1]==0 ? 'red' : 'green')  }} />
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

                    <button
                        className={`flex-1 p-4 border rounded max-w-xs flex justify-center items-center font-semibold ${bottomLockEnable ? 'bg-blue-500 text-white' : 'bg-white text-black'
                            }`}
                        disabled={!bottomLockEnable}
                        onClick={handleSubmit}
                    >
                        Lock Bottom
                    </button>
                </div>
                <p>Instruksi: {instruksimsg}</p>
            </div>
            <footer className='flex-1 rounded border flex justify-center gap-40 p-3 bg-white'  >
                <p>Server Status: 192.168.1.5 Online</p>
                <p>Status PLC : Online</p>
            </footer>
        </main>
    );
};

export default Home;
