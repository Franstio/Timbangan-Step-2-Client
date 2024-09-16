
import React, { Fragment, useState, useEffect } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import axios from "axios";
import io from 'socket.io-client';
import GaugeComponent from 'react-gauge-component'
const apiClient = axios.create({
    withCredentials: false
});
const Home = () => {
    const [allowReopen,setAllowReopen] = useState(false);
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
    const [maxWeight,setMaxWeight] = useState(0);
    const navigation = [
        { name: 'Dashboard', href: '#', current: true },
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }
    useEffect(() => {
        setSocket(io(`http://${process.env.REACT_APP_TIMBANGAN}/`,{
            reconnection: true,
            autoConnect: true,
            reconnectionAttempts: 100
        }));
        setLocalSocket(io(`http://localhost:5000/`,{
        reconnection: true,
        autoConnect: true,
        reconnectionAttempts: 100
        }));
    }, [])
    useEffect(() => {
        if (!localSocket)
            return;
        localSocket.on('UpdateInstruksi', (instruksi) => {
            
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
        if (processStatus == undefined ||  processStatus==null)
            return;
        if (processStatus)
        {
            startObserveBottomSensor(0);
            localSocket.on('target-0',(res)=>{
                startProcess(false);
                setinstruksimsg("Tutup Penutup Bawah");
                localSocket.off('target-0');
            });

        }
        else
        {
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
        if (topProcessStatus == undefined || topProcessStatus==null)
            return;
        if (topProcessStatus)
        {
            startObserveTopSensor(0);
            localSocket.on('target-top-0',(res)=>{
                startTopProcess(false);
                setinstruksimsg("Tutup Penutup Atas");
                localSocket.off('target-top-0');
            });

        }
        else
        {
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
            if (type=='Collection')
                startProcess(true);
            else
                startTopProcess(true);
        });
        localSocket.on('sensorUpdate',(data)=>{
            if (!data)
                return;
            const _data = [];
            for (let i=0;i<data.length;i++)
            {
                _data.push(data[i] ?? 0);
            }
            setSensor(_data);
        });
    }, [localSocket]);
    useEffect(() => {
        axios.get('http://localhost:5000/hostname', { withCredentials: false })
            .then(response => {

                setHostname(response.data.hostname);
            })
            .catch(error => {
                console.log('Error fetching the hostname:', error);
            });
    }, []);
    useEffect(() => {
        if (!socket)
            return;
        if (hostname && hostname != '')
        {
            
            socket.emit('getWeightBin', hostname);
            setInterval(()=>{
                socket.emit('getWeightBin', hostname);
            },30*1000);
        }
    }, [hostname, socket]);
    useEffect(() => {
        /*socket.on('connect', ()=>{
            socket.emit('getWeightBin',hostname);
        });*/
        if (!socket)
            return;
        socket.on('getweight', (data) => {
            setGetweightbin(prev => data.weight);
            setMaxWeight(data.max_weight);
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
        } catch (error) {
            console.log(error);
        }
    };

    const readSensorBottom = async () => {
        try {
            const response = await apiClient.post(`http://localhost:5000/sensorbottom`, {
                SensorBottomId: 1
            });
            if (response.status !== 200) {
                return;
            }

            const sensorData = response.data.sensorBottom; // Ambil data sensor dari respons

            // Konversi nilai sensor menjadi bentuk boolean
            return sensorData == 1;

        } catch (error) {
            console.log(error);
            return { error: error };
        }
    };

    async function sendGreenlampOff() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/greenlampoff/`, {
                idLampGreen: 1
            });
            //setinstruksimsg("buka pintu atas");
        } catch (error) {
            console.log(error);
        }
    }

    async function sendYellowOn() {
        try {
            const response = await apiClient.post(`http://${hostname}.local:5000/yellowlampon/`, {
                idLampYellow: 1
            });
            //setinstruksimsg("buka pintu atas");
        } catch (error) {
            console.log(error);
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
        const _final = (Getweightbin / maxWeight) * 100;
        return (_final  >= 100) ? 100 : _final;
    };
 // Dapatkan nilai GaugeComponent yang sesuai
    return (
        <main>

<Disclosure as="nav" className="bg-gray-800">
                {({ open }) => (
                    <>
                        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                            <div className="relative flex h-16 items-center justify-between">
                                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                                    <div className="flex flex-shrink-0 items-center">
                                        <img
                                            className="h-8 w-auto"
                                            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                                            alt="Your Company"
                                        />
                                    </div>
                                    <div className="hidden sm:ml-6 sm:block">
                                        <div className="flex space-x-4">
                                            {navigation.map((item) => (
                                                <a
                                                    key={item.name}
                                                    href={item.href}
                                                    className={classNames(
                                                        item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                        'rounded-md px-3 py-2 text-sm font-medium'
                                                    )}
                                                    aria-current={item.current ? 'page' : undefined}
                                                >
                                                    {item.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Disclosure.Panel className="sm:hidden">
                            <div className="space-y-1 px-2 pb-3 pt-2">
                                {navigation.map((item) => (
                                    <Disclosure.Button
                                        key={item.name}
                                        as="a"
                                        href={item.href}
                                        className={classNames(
                                            item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                            'block rounded-md px-3 py-2 text-base font-medium'
                                        )}
                                        aria-current={item.current ? 'page' : undefined}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                ))}
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
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
                                            limit: 90,
                                            color: 'RED',
                                            showTick: true
                                        },
                                    ]
                                }}
                                value={getGaugeValue()}
                                style={{ width: '100%', height: '20%' }} // Ensure the gauge fits the container
                            />

                        </div>
                        <p className='flex justify-center text-xl'>{Getweightbin}Kg</p>
                    </div>

                    <div className='flex-1 p-4 border rounded max-w-md bg-white'>
                        <h1 className='text-center text-blue-600 font-semibold'>Status</h1>

                        <div className='flex justify-between'>
                            <p className=''>Green</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color:  (sensor[4] == 0? 'gray' : 'green') }} />
                        </div>
                        <div className='flex justify-between'>
                            <p>Yellow</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color:  (sensor[3] == 0? 'gray' : 'green')  }} />
                        </div>
                        <div className='flex justify-between'>
                            <p>Red</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color:  (sensor[2] == 0? 'gray' : 'green') }} />
                        </div>
                        <div className='mt-20'>
                        <p className='flex justify-center font-semibold text-blue-600'>Instruksi</p>
                        <p className='flex justify-center text-xl'>{instruksimsg}</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center gap-10 mt-10">
                    <div className='flex-1 p-4 border rounded bg-white'>
                        <h1 className='font-semibold text-blue-600 text-center'>Sensor Status</h1>
                        <div className='flex justify-between'>
                            <p className=''>Top</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: (sensor[0] == 0 ? 'gray' : 'green') }} />
                        </div>

                        <div className='flex justify-between'>
                            <p>Bottom</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: (sensor[1]==0 ? 'gray' : 'green')  }} />
                        </div>
                    </div>
                    <div className='flex-1 p-4 border rounded max-w-md bg-white'>
                        <h1 className='text-center font-semibold text-blue-600'>Lock Status</h1>

                        <div className='flex justify-between'>
                            <p className=''>Top</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color: (sensor[5] == 0? 'gray' : 'green') }} />
                        </div>

                        <div className='flex justify-between'>
                            <p>Bottom</p>
                            <FiberManualRecordIcon fontSize="small" style={{ color:  (sensor[6] == 0? 'gray' : 'green')}} />
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
                {
                    allowReopen && (
                        <div className='flex justify-center mt-10 w-full'>
                            <button  className={`flex-1 p-4 border rounded  flex justify-center items-center font-semibold bg-blue-500 text-white w-full`}>Reopen Lock</button>
                        </div>
                    )
                }
            </div>
            <footer className='flex-1 rounded border flex justify-center gap-40 p-3 bg-white'  >
                <p>Server Status: 192.168.1.5 Online {socket.connect ? "Online":"Offline"}</p>
                <p>Status PLC : {localSocket.connected ? "Online": "Offline"}</p>
            </footer>
        </main>
    );
};

export default Home;
