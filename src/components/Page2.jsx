
import React, { useState, useEffect, Fragment } from "react";
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { IoSettingsOutline } from "react-icons/io5";
import { FiRefreshCcw } from "react-icons/fi";
import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import axios from "axios";
import io from 'socket.io-client';
import {
    Container,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Grid,
} from '@mui/material';

const apiClient = axios.create({
    withCredentials: false
});
const Home = () => {
    const [user, setUser] = useState(null);
    const [Scales4Kg, setScales4Kg] = useState({});
    const [Scales50Kg, setScales50Kg] = useState({});
    const [isFinalStep, setFinalStep] = useState(false);
    const [scanData, setScanData] = useState('');
    const [container, setContainer] = useState(null);
    const [wasteId, setWasteId] = useState(null);
    const [Idbin, setIdbin] = useState(-1);
    const [containerName, setContainerName] = useState('');
    const [isFreeze, freezeNeto] = useState(false);
    const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [finalneto, setFinalNeto] = useState(0);
    const [neto, setNeto] = useState({});
    const [neto50Kg, setNeto50kg] = useState(0);
    const [neto4Kg, setNeto4kg] = useState(0);
    const [toplockId, settoplockId] = useState('');
    const [instruksimsg, setinstruksimsg] = useState("");
    const [type, setType] = useState("");
    const [weightbin, setWeightbin] = useState("");
    const [binDispose,setBinDispose] = useState({});
    const [bottomLockHostData, setBottomLockData] = useState({ binId: '', hostname: '' });
    const [socket, setSocket] = useState(); // Sesuaikan dengan alamat server
    //    const socket = null;
    const navigation = [
        { name: 'Dashboard', href: '#', current: true },
        { name: 'Calculation', href: '#', current: false }
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const BorderLinearProgress = styled(LinearProgress)(({ theme, value }) => ({
        height: 10,
        borderRadius: 5,
        [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
        },
        [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 5,
            backgroundColor: value > 70 ? '#f44336' : theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8',
        },
    }));

    const CustomLinearProgress = ({ value }) => {
        return (
            <LinearProgress
                variant="determinate"
                value={value}
                color={value > 70 ? 'error' : 'primary'}
                style={{ width: '90%', height: 10, borderRadius: 5, marginRight: '10px' }}
            />
        );
    };

    const sendLockBottom = async () => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/lockBottom`, {
                idLockBottom: 1
            });
            if (response.status != 200) {
                console.log(response);
                return;
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const sendGreenlampOn = async() => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/greenlampon`, {
                idLampGreen: 1
            });
            if (response.status != 200) {
                console.log(response);
                return;
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendYellowOff = async() => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/yellowlampoff`, {
                idLampYellow: 1
            });
            if (response.status != 200) {
                console.log(response);
                return;
            }
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        if (bottomLockHostData.binId != '' && bottomLockHostData.hostname != '') {
            new Promise(async ()=>
                {
                    await sendLockBottom();
                    await sendYellowOff();
                    await sendGreenlampOn();
                    Promise.resolve();
                }).then(()=>{
                setBottomLockData({binId:'',hostname:''});
                setinstruksimsg("buka penutup bawah");
                UpdateBinWeightCollection();
            });
        }
    }, [bottomLockHostData]);

    const UpdateBinWeightCollection = async () => {
        try {
            const response = await apiClient.post('http://PCS.local:5000/UpdateBinWeightCollection', {
                binId: bottomLockHostData.binId
            }).then(x => {
                const res = x.data;
                console.log(res);
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        setSocket(io('http://PCS.local:5000/'));

    
    }, []);
    useEffect(()=>{
        if (!socket)
            return;
        socket.emit('connectScale');
    
        socket.on('data1', (weight50Kg) => {
            try {
                //console.log(weight50Kg);
                const weight50KgValue = weight50Kg && weight50Kg.weight50Kg ? parseFloat(weight50Kg.weight50Kg.replace("=", "") ?? '0') : 0;
                if (weight50KgValue > 0) {
                    setScales50Kg({ weight50Kg: weight50KgValue });
                }
            } catch (error) {
                console.error(error);
            }
        });
    
        socket.on('data', (data) => {
           // console.log(data);
            if (data.weight > 0) {
                const weight4KgInKg = parseFloat(data.weight) / 1000;
                setScales4Kg({ weight4Kg: weight4KgInKg });
            }
        });
    },[socket])
    
    useEffect(() => {
        const binWeight = container?.weightbin ?? 0;
        let finalWeight = 0;
    
        if (Scales50Kg?.weight50Kg ) { 
            finalWeight = parseFloat(Scales50Kg.weight50Kg) - parseFloat(binWeight);
        }
        if (isFreeze)
            return
        setNeto50kg(finalWeight);
    
    }, [Scales50Kg, , container?.weightbin]); 
    
    useEffect(()=> {
        let finalWeight= 0;
        const binWeight = container?.weightbin ?? 0;
        if (Scales4Kg?.weight4Kg ) {
            finalWeight = parseFloat(Scales4Kg.weight4Kg) - parseFloat(binWeight);
        }
        if (isFreeze)
            return
        setNeto4kg(finalWeight);
    },[Scales4Kg,container?.weightbin]);

    const toggleModal = () => {
        freezeNeto(true);
        setShowModal(!showModal);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (user == null)
                handleScan();
            else if (isFinalStep) {
                console.log(binDispose);
                if(binDispose.name != scanData ){
                    alert("mismatch name" );
                    return;
                }
                //VerificationScan();
                setIdbin(binDispose.id);
                setScanData('');
            }
            else {
                handleScan1();
            }
        }
    }; 

    useEffect(() => {
        if (Idbin != -1) {
            saveTransaksi();
        }
    }, [Idbin])
    useEffect(() => {
        if (toplockId != '') {
            sendLockTop();
            settoplockId('');
        }
    }, [toplockId]);
    const CheckBinCapacity = async () => {
        const _finalNeto = neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
        try {
            console.log(container);
            const response = await apiClient.post('http://localhost:5000/CheckBinCapacity', {
                IdWaste: container.IdWaste,
                neto: _finalNeto
            }).then(x => {
                const res = x.data;
                if (!res.success) {
                    alert(res.message);
                    return;
                }
                console.log(res);
                settoplockId(res.bin.name_hostname);
//                setIdbin(res.bin.id);
                setBinDispose(res.bin);
            });
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
    };

    async function sendLockTop() {
        try {
            console.log(toplockId);
            const response = await apiClient.post(`http://${toplockId}.local:5000/locktop/`, {
                idLockTop: 1
            });
            setinstruksimsg("buka penutup atas");
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleScan = () => {
        apiClient.post('http://localhost:5000/ScanBadgeid', { badgeId: scanData })
            .then(res => {
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                    if (res.data.user) {
                        setUser(res.data.user);
                        setScanData('');
                    } else {
                        alert("User not found");
                        setUser(null);
                        setScanData('');
                    }
                }
            })
            .catch(err => console.error(err));
    };

    const handleScan1 = () => {
        apiClient.post('http://localhost:5000/ScanContainer', { containerId: scanData })
            .then( (res) => {
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                    if (res.data.container) {
                        console.log(res.data.container);
                        if (res.data.container.IdWaste != wasteId && wasteId != null) {
                            alert("Waste Mismatch");
                            return;
                        }
                        console.log(res.data.container);
                        if (res.data.container.type == "Collection") {
                            const _bin = res.data.container.waste.bin.find(item => item.name == res.data.container.name);

                            if (!_bin) {
                                alert("Bin Collection error");
                                return;
                            }
                            console.log(_bin);
                            const collectionPayload = {...res.data.container,weight: _bin.weight};
                            saveTransaksiCollection(collectionPayload);
                            setBottomLockData({ binId: _bin.id, hostname: _bin.name_hostname });
                            setShowModal(false);
                            setScanData('');
                            setUser(null);
                            setContainer(null);
                            return;
                        }
                        else{
                            setContainer(res.data.container);
                            setType(res.data.container.type);
                       
                        }
                        setWasteId(res.data.container.IdWaste);
                        setScanData('');
                        setIsSubmitAllowed(true);
                    } else {
                        alert("Countainer not found");
                        setUser(null);
                        setContainer(null);
                        setContainerName(res.data.name || '');
                        setScanData('');
                        setIsSubmitAllowed(false);
                    }
                }
            })
            .catch(err => console.error(err));
    };

    const VerificationScan = () => {
        apiClient.post('http://localhost:5000/VerificationScan', { binName: scanData })
            .then( (res) => {
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                    console.log(res.data.bin);
                }
            })
            .catch(err => console.error(err));
    };

    const saveTransaksi = () => {
        const _finalNeto = neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
        apiClient.post("http://localhost:5000/SaveTransaksi", {
            payload: {
                idContainer: container.containerId,
                badgeId: user.badgeId,
                IdWaste: container.IdWaste,
                type: type,
                weight: _finalNeto
            }
        }).then(res => {
            setWasteId(container.IdWaste);
            setScanData('');
            updateBinWeight();
        });
    };

    const saveTransaksiCollection = (_container) => {
        console.log(_container);
        apiClient.post("http://PCS.local:5000/SaveTransaksiCollection", {
            payload: {
                idContainer: _container.containerId,
                badgeId: user.badgeId,
                IdWaste: _container.IdWaste,
                type: _container.type,
                weight: _container.weight
            }
        }).then(res => {
            setWasteId(_container.IdWaste);
            setScanData('');
        });
    };

    const updateBinWeight = async () => {
        try {
            const _finalNeto = neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
            const response = await apiClient.post('http://localhost:5000/UpdateBinWeight', {
                binId: Idbin,
                neto: _finalNeto
            }).then(x => {
                setScanData('');
                setUser(null);
                setContainer(null);
                setNeto(0);
                freezeNeto(false);
                setFinalStep(false);
                setIsSubmitAllowed(false);
                setIdbin(-1);
            });
        }
        catch (error) {
            console.error(error);
        }
    }

    const handleSubmit = () => {
        const binWeight = container?.weightbin ?? 0;
        const totalWeight = parseFloat(neto) + parseFloat(binWeight);
        console.log(binWeight);
        console.log(type);

        if (type == 'Dispose') {
            if (neto4Kg > 4) {
                alert("Berat limbah melebihi kapasitas ,sihlakan menggunakan timbangan lain.");
                return;
            }
            CheckBinCapacity();
            setIsSubmitAllowed(false);
            setFinalStep(true); 
        }
        setShowModal(false);
    }

    const handleCancel = () => {
        toggleModal();
        freezeNeto(false);
    };

    return (
        <main>
            <Disclosure as="nav" className="bg-gray-800">
                {({ open }) => (
                    <>
                        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                            <div className="relative flex h-16 items-center justify-between">
                                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                    {/* Mobile menu button*/}
                                    <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                        <span className="absolute -inset-0.5" />
                                        <span className="sr-only">Open main menu</span>
                                        {open ? (
                                            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                        ) : (
                                            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                        )}
                                    </Disclosure.Button>
                                </div>
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
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                    <button
                                        type="button"
                                        className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    >
                                        <span className="absolute -inset-1.5" />
                                        <span className="sr-only">View notifications</span>
                                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>

                                    {/* Profile dropdown */}
                                    <Menu as="div" className="relative ml-3">
                                        <div>
                                            <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                                <span className="absolute -inset-1.5" />
                                                <span className="sr-only">Open user menu</span>
                                                <IoSettingsOutline fontSize="1.5em" style={{ color: 'white' }} />
                                            </Menu.Button>
                                        </div>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <a
                                                            href="#"
                                                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                        >
                                                            Your Profile
                                                        </a>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <a
                                                            href="#"
                                                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                        >
                                                            Settings
                                                        </a>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <a
                                                            href="#"
                                                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                        >
                                                            Sign out
                                                        </a>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
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
            <div className='bg-[#f4f6f9] p-5'>
                <div className="grid grid-cols-3 grid-flow-col gap-5">
                    <div className="col-span-1 ...">
                        <div className='flex-1 p-4 border rounded bg-white'>
                            <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Bruto</h1>
                            <div className=''>
                                <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{Scales4Kg?.weight4Kg?.toFixed(2) ?? 0}<FiRefreshCcw size={20} /></div>
                                <p className='flex justify-center text-2xl font-bold'>Gram</p>
                            </div>
                        </div>
                    </div>
                    <div className="row-span-1">
                        <div className='flex-1 p-4 border rounded bg-white'>
                            <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Neto</h1>
                            <div className=''>
                                <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{neto4Kg.toFixed(2)} <FiRefreshCcw size={20} /></div>
                                <p className='flex justify-center text-2xl font-bold'>Gram</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1 ...">
                        <div className='flex-1 p-4 border rounded bg-white'>
                            <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Bruto</h1>
                            <div className=''>
                                <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{Scales50Kg?.weight50Kg?.toFixed(2) ?? 0}<FiRefreshCcw size={20} /></div>
                                <p className='flex justify-center text-2xl font-bold'>Kilogram</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1 ...">
                        <div className='flex-1 p-4 border rounded bg-white'>
                            <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Neto</h1>
                            <div className=''>
                                <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{neto50Kg.toFixed(2)} <FiRefreshCcw size={20} /></div>
                                <p className='flex justify-center text-2xl font-bold'>Kilogram</p>
                            </div>
                        </div>
                    </div>
                    <div className="row-span-2 col-span-2">
                        <div className='flex-1 p-4 border rounded bg-white h-full'>
                            <h1 className='text-blue-600 font-semibold text-xl mb-3'>Scanner Result</h1>
                            <p>Please Scan..</p>
                            <input
                                type="text"
                                name="text"
                                id="userId"
                                value={scanData}
                                onKeyDown={e => handleKeyPress(e)}
                                onChange={e => setScanData(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="luGGIatKmKvdMkcxpKc8SZD64ex5W0"
                            />
                            <button className='block w-full border rounded py-2 flex justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg' disabled={!isSubmitAllowed} onClick={toggleModal}>Submit</button>
                            <div className='text-lg mt-5'>
                                <p>Username: {user?.username} </p>
                                <p>Container Id: {container?.name}</p>
                                <p>Type Waste: {container?.waste.name}</p>
                            </div>
                        </div></div>
                </div>

                <div className='flex justify-start'>
                    {showModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            {parseFloat(neto50Kg > neto4Kg ? neto50Kg : neto4Kg).toFixed(2)}Kg
                                        </Typography>
                                        <p>Data Timbangan Sudah Sesuai?</p>
                                        <div className="flex justify-center mt-5">
                                            <button type="button" onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded">Ok</button>
                                            <button type="button" onClick={handleCancel} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p>Instruksi : {instruksimsg}</p>
            </div>
            <footer className='flex-1 rounded border flex justify-center gap-40 p-3 bg-white'  >
                <p>Server Status: 192.168.1.5 Online</p>
                <p>Status PLC : Online</p>
            </footer>
        </main>
    );
};

export default Home;
