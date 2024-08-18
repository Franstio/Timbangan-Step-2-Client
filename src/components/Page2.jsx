import React, { useState, useEffect, Fragment, useRef } from "react";
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
    const [continueState,setContinueState] = useState(false);
    const [isFinalStep, setFinalStep] = useState(false);
    const [scanData, setScanData] = useState('');
    const [container, setContainer] = useState(null);
    const [waste, setWaste] = useState(null);
    const [wastename, setWastename] = useState('');
    const [Idbin, setIdbin] = useState(-1);
    const [binname, setBinname] = useState('')
    const [containerName, setContainerName] = useState('');
    const [isFreeze, freezeNeto] = useState(false);
    const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showContinueModal,toggleContinueModal] = useState(false);
    const [showModalDispose, setShowModalDispose] = useState(false);
    const [showModalInfoScale, setShowModalInfoScales] = useState(false);
    const [finalneto, setFinalNeto] = useState(0);
    const [neto, setNeto] = useState({});
    const [neto50Kg, setNeto50kg] = useState(0);
    const [neto4Kg, setNeto4kg] = useState(0);
    const [toplockId, settoplockId] = useState({ hostname: '' });
    const [instruksimsg, setinstruksimsg] = useState("");
    const [message, setmessage] = useState("");
    const [type, setType] = useState("");
    const [typecollection, setTypeCollection] = useState("");
    const [weightbin, setWeightbin] = useState("");
    const [binDispose, setBinDispose] = useState({});
    //const [ScaleName, setScaleName] = useState("");
    const inputRef = useRef(null);
    const [bottomLockHostData, setBottomLockData] = useState({ binId: '', hostname: '' });
    const [socket, setSocket] = useState(); // Sesuaikan dengan alamat server
    const [rackTarget, setRackTarget] = useState(process.env.REACT_APP_RACK);
    const [apiTarget, setApiTarget] = useState(process.env.REACT_APP_PIDSG);
    const [transactionData,setTransactionData] = useState({});
    const [logindate,setLoginDate] = useState('');
    //const ScaleName = getScaleName();


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

    /*const getRackLastTransaction = async (containerName)=>{
        const res  = await apiClient.get(`http://${rackTarget}/Transaksi/${containerName}`);
        const weight = res.data.weight;
        const weightlist = {...lastRackWeight};
        if (!weightlist[containerName])
            weightlist[containerName].weight = 0;
        if (weight ==0 )
            weightlist[containerName].weight = 0;
        else
            weightlist[containerName].weight = parseFloat(weightlist[containerName].weight)+ parseFloat(weight);
        setLastRackWeight({...weightlist});
        return weightlist;
    }*/
    const sendLockBottom = async () => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/lockBottom`, {
                idLockBottom: 1
            });
            if (response.status != 200) {
                return;
            }
        }
        catch (error) {
        }
    }
    const formatDate = (date)=> {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return [year, month, day].join('-');
    }

    const sendDataPanasonicServer = async (stationName, frombinname, tobinname, weight, type) => {
//        const _finalNeto = getWeight();
        try {
            const response = await apiClient.post(`http://${apiTarget}/api/pid/pidatalog`, {
                badgeno: user.badgeId,
                logindate: '',
                stationname: stationName,
                frombinname: frombinname,
                tobinname: tobinname,
                weight: weight,
                activity: type

            });
            if (response.status != 200) {
                return false;
            }
            await sendWeight(frombinname,weight);
            return response.data.status == 'Success';
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }


    useEffect(() => {
        let targetHostName = '';
        if (binDispose && binDispose.name_hostname)
            targetHostName = binDispose.name_hostname;
        else if (bottomLockHostData && bottomLockHostData.hostname)
            targetHostName = bottomLockHostData.hostname;
        console.log([targetHostName,binDispose,bottomLockHostData]);
        if (targetHostName == '' || targetHostName == null || targetHostName == undefined)
            return;
        sendPesanTimbangan(targetHostName, instruksimsg);
        
    }, [instruksimsg]);


    const sendGreenlampOn = async () => {
        try {
            const response = await apiClient.post(`http://${toplockId}.local:5000/greenlampon`, {
                idLampGreen: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendGreenlampOnCollection = async () => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/greenlampon`, {
                idLampGreen: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendGreenlampOff = async (targetName) => {
        try {
            const response = await apiClient.post(`http://${targetName}.local:5000/greenlampoff`, {
                idLampGreen: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendYellowOff = async () => {
        try {
            const response = await apiClient.post(`http://${toplockId}.local:5000/yellowlampoff`, {
                idLampYellow: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendYellowOffCollection = async () => {
        try {
            const response = await apiClient.post(`http://${bottomLockHostData.hostname}.local:5000/yellowlampoff`, {
                idLampYellow: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendYellowOn = async (targetName) => {
        try {
            const response = await apiClient.post(`http://${targetName}.local:5000/yellowlampon`, {
                idLampYellow: 1
            });
            if (response.status != 200) {
                return;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const sendPesanTimbangan = async (target, instruksi) => {
        try {
            const response = await apiClient.post('http://' + target + '.local:5000/instruksi', {
                instruksi: instruksi
            });
        } catch (error) {
            console.log(error);
        }
    };

    const sendType = async (target, type) => {
        try {
            const response = await apiClient.post('http://' + target + '.local:5000/type', {
                type: type
            });
        } catch (error) {
            console.log(error);
        }
    };

    const readSensorTop = async (targetName) => {
        try {
            const response = await apiClient.post(`http://${targetName}.local:5000/sensortop`, {
                SensorTopId: 1
            });
            if (response.status !== 200) {
                return;
            }

            const sensorData = response.data.sensorTop; // Ambil data sensor dari respons

            // Konversi nilai sensor menjadi bentuk boolean
            return sensorData == 1;

        } catch (error) {
            console.log(error);
            return { error: error };
        }
    };

    useEffect(() => {
        if (bottomLockHostData.binId && bottomLockHostData.hostname && bottomLockHostData.binId != '' && bottomLockHostData.hostname != '') {
            new Promise(async () => {
                setinstruksimsg("Buka Penutup Bawah");
                await sendYellowOffCollection();
                await sendGreenlampOnCollection();
                await UpdateBinWeightCollection();
                await sendLockBottom();
                //await sendDataPanasonicServer();
                Promise.resolve();
            }).then(() => {
                setBottomLockData({ binId: '', hostname: '' });
                //setinstruksimsg("buka penutup bawah");
            });
        }
    }, [bottomLockHostData]);

    const UpdateBinWeightCollection = async () => {
        try {
            const response = await apiClient.post(`http://${process.env.REACT_APP_TIMBANGAN}/UpdateBinWeightCollection`, {
                binId: bottomLockHostData.binId
            }).then(x => {
                const res = x.data;
            });
        }
        catch (error) {
        }
    }
    useEffect(() => {
        setSocket(io(`http://${process.env.REACT_APP_TIMBANGAN}/`));


    }, []);
    useEffect(() => {
        if (!socket)
            return;
        socket.emit('connectScale');

        socket.on('data1', (weight50Kg) => {
            try {
                const weight50KgValue = weight50Kg && weight50Kg.weight50Kg ? parseFloat(weight50Kg.weight50Kg.replace("=", "") ?? '0') : 0;
                setScales50Kg({ weight50Kg: weight50KgValue });
            } catch (error) {
                console.log(error);
            }
        });

        socket.on('data', (data) => {
            const weight4KgInKg = parseFloat(data?.weight ?? 0) / 1000;
            setScales4Kg({ weight4Kg: weight4KgInKg });
        });
    }, [socket])

    useEffect(() => {
        const binWeight = container?.weightbin ?? 0;
        let finalWeight = 0;

        if (Scales50Kg?.weight50Kg) {
            finalWeight = parseFloat(Scales50Kg.weight50Kg) - parseFloat(binWeight);
        }
        if (isFreeze)
            return
        setNeto50kg(finalWeight);

    }, [Scales50Kg, , container?.weightbin]);

    useEffect(() => {
        let finalWeight = 0;
        const binWeight = container?.weightbin ?? 0;
        if (Scales4Kg?.weight4Kg) {
            finalWeight = parseFloat(Scales4Kg.weight4Kg) - parseFloat(binWeight);
        }
        if (isFreeze)
            return
        setNeto4kg(finalWeight);
    }, [Scales4Kg, container?.weightbin]);

    const toggleModal = () => {
        freezeNeto(true);
        setShowModal(!showModal);
    };

    const toggleModalDispose = () => {
        //freezeNeto(true);
        setShowModalDispose(!showModalDispose);
    };

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            if (user == null)
                handleScan();
            else if (isFinalStep) {
                if (container.waste.handletype != 'Rack')
                {
                    const isSensorTop = await readSensorTop(binDispose.name_hostname);
                    if (isSensorTop.error) {
                        alert("Error Ketika Membaca Sensor");
                        setScanData('');
                        return;
                    }
                    if (!isSensorTop) {
                        alert("Tutup Penutup Atas.");
                        setScanData('');
                        return;
                    }
                }
                if (binDispose.name != scanData) {
                    alert("mismatch name");
                    setScanData('');
                    return;
                }
                if (transactionData.idscraplog)
                    await updateTransaksi('Dispose');
                if (container.waste.handletype=="Rack" || waste.handletype =='Rack')
                    await saveTransaksiRack( container,binDispose.name,'Dispose');
                else
                    setIdbin(binDispose.id);
                
                //VerificationScan();
                
//                setScanData('');
            }
            else {
                handleScan1();
            }
        }
    };

    useEffect(() => {
        if (!showModalInfoScale && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showModalInfoScale]);

    useEffect(() => {
        if (!showModalDispose && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showModalDispose]);


    const handleKeyPressModal = (e) => {
        if (e.key === 'Enter') {
            setShowModalInfoScales(false);
            setShowModalDispose(false);
        }
    };
    const work =  async()=>{

        await updateBinWeight();
        await saveTransaksi();
        setTransactionData({});
        setWaste(null);
        setUser(null);
        setmessage('');
        setinstruksimsg('');
    }
    useEffect(() => {
        if (Idbin != -1) {
            if (Idbin != undefined)
                work();
            setScanData('');
            setContainer(null);
            setmessage('');
            setNeto(0);
            freezeNeto(false);
            setFinalStep(false);
            setIsSubmitAllowed(false);
            setIdbin(-1);
        }
    }, [Idbin])
    useEffect(() => {
        if (toplockId !== '') {
            (async () => {
                try {
                    await sendYellowOff();
                    await sendGreenlampOn();
                    await sendLockTop();
                } catch (error) {
                    console.log('Error executing actions:', error);
                } finally {
                    settoplockId(''); // Clear the toplockId after all actions are done
                }
            })();
        }
    }, [toplockId]);
    const CheckBinCapacity = async () => {
        const _finalNeto = getWeight();// neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
        try {
            const url = container.waste.handletype=='Rack' ? rackTarget : "localhost:5000";
            const response = await apiClient.post(`http://${url}/CheckBinCapacity`, {
                IdWaste: container.IdWaste,
                neto: _finalNeto
            }).then(x => {
                const res = x.data;
                if (!res.success) {
                    alert(res.message);
                    return;
                }
                setBinDispose(res.bin);
                settoplockId(res.bin.name_hostname);
                setBinname(res.bin.name);
                //              setIdbin(res.bin.id);
            });
        }
        catch (error) {
        }
    };
    const CheckBinCapacityRack = async (data)=>{
        const lines = data.trim().split('-');
        const line = lines[lines.length-2];
        const res = await apiClient.post(`http://${rackTarget}/CheckBinCapacity`,{
            line:line
        });
        const bin = res.data.bins[0];
        try
        {
            const _res = await apiClient.get(`http://localhost:5000/bin/`+bin.name);
            bin.id= _res.data.bin.id;
            setBinDispose(bin);
            setBinname(bin.name);
            return bin;
        }
        catch (err)
        {
            alert("Bin From Rack not found");
            return null;
        }
    }
    useEffect(() => {
        if (!binDispose || !binDispose.name_hostname)
            return;
        setinstruksimsg("buka penutup atas");
        sendType(binDispose.name_hostname, 'Dispose');
    }, [binDispose]);
    async function sendLockTop() {
        try {
            const response = await apiClient.post(`http://${toplockId}.local:5000/locktop/`, {
                idLockTop: 1
            });
            setinstruksimsg("Buka Penutup Atas");
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(()=>{
        if (user==null || container == null)
            setScanData('');
    },[user,container])
    const handleScan = () => {
        apiClient.post('http://localhost:5000/ScanBadgeid', { badgeId: scanData })
            .then(res => {
                if (res.data.error) {
                    setScanData('');
                    setUser(null);
                    alert(res.data.error);
                } else {
                    if (res.data.user) {
                        setLoginDate(formatDate(new Date().toISOString()));
                        setUser(res.data.user);
                        setScanData('');
                        setmessage("Scan Bin Machine/Bin");
                    } else {
                        alert("User not found");
                        setUser(null);
                        setScanData('');
                    }
                }
            })
            .catch(err => console.log(err));
    };
    useEffect(() => {
        if (!waste || waste == null)
            return;
        setmessage(getScaleName());
    }, [waste]);
    const verifyBadge = async (station)=>{
        if (!user || !user.badgeId )
            return false;
        try
        {
            const res = await apiClient.get(`http://${apiTarget}/api/pid/pibadgeverify?f1=${station}&f2=${user.badgeId}`);
            console.log(res);
            return true;
        }
        catch (err)
        {
            console.log(err);
            return false;
        }
    }
    const handleScan1 = async () => {
        try {
            const res = await apiClient.post('http://localhost:5000/ScanContainer', { containerId: scanData });
            if (res.data.error) {
                setScanData('');
                setContainer(null);
                alert(res.data.error);
            } else {
                if (res.data.container) {
                    const badgeCheck = await verifyBadge(res.data.container.station)
                    if (!badgeCheck)
                    {
                        alert("Badge Check Failed");
                        return;
                    }
                    /*if ( waste != null && res.data.container.IdWaste != waste.IdWaste ) {
                        alert("Waste Mismatch");
                        return;
                    }*/
                    const prevWaste = waste?.name;
                    const _waste = res.data.container.waste;
                    setTypeCollection(res.data.container.type);
                    setWaste(_waste);
                    setmessage('');
                    if (res.data.container.type == "Collection" ) {
                        if (continueState)
                        {
                            alert("Collection Transaction is not allowed");
                            return;
                        }
                        const _bin = res.data.container.waste.bin.find(item => item.name == res.data.container.name);

                        if (!_bin) {
                            alert("Bin Collection error");
                            return;
                        }
                        const collectionPayload = { ...res.data.container, weight: _bin.weight };
//                        await updateTransaksiManual(_idscraplog,"Collection",_waste);
                        if (res.data.container.waste.handletype=='Rack')
                        {
                            await saveTransaksiRack(collectionPayload,'','Collection');
                        }
                        else
                            saveTransaksiCollection(collectionPayload);
                        //                            UpdateBinWeightCollection();
                        setBottomLockData({ binId: _bin.id, hostname: _bin.name_hostname });
                        setShowModal(false);
                        setScanData('');
                        setUser(null);
                        setContainer(null);
                        sendType(_bin.name_hostname, 'Collection');
                        setBinname(_bin.name);
                        setinstruksimsg('')
                        setTypeCollection(res.data.container.type);
                        setmessage('');
                        return;
                    }
                    else {
                        let _idscraplog = '';
                        if (continueState && _waste.name != prevWaste)
                        {
                            alert("Waste name mismatch");
                            setScanData('');
                            return;
                        }
                        if (_waste.step1)
                        {
                            try
                            {
                                const checkTr = await apiClient.get("http://localhost:5000/Transaksi/"+scanData);
                                const tr = checkTr.data;
                                _idscraplog = tr.idscraplog;
                                setTransactionData(tr);
                            }
                            catch (err)
                            {
                                alert("Error Fetching Transaction");
                                return;
                            }
                        }
                        else
                            setTransactionData({});
                        setContainer(res.data.container);
                        setType(res.data.container.type);
                        setShowModalInfoScales(true);
                    }
                    setWastename(res.data.container.waste.name);
                    setScanData('');
                    setIsSubmitAllowed(true);
                } else {
                    alert("Container not found");
                    setUser(null);
                    setContainer(null);
                    setContainerName(res.data.name || '');
                    setScanData('');
                    setIsSubmitAllowed(false);
                }
            }

        }
        catch (err) {
            console.log(err)
        };
    };

    const VerificationScan = () => {
        apiClient.post('http://localhost:5000/VerificationScan', { binName: scanData })
            .then((res) => {
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                }
            })
            .catch(err => console.log(err));
    };
    const getWeight = () => {
        return waste.scales == "4Kg" ? neto4Kg : neto50Kg;
    }
    const getScaleName = () => {
        //setmessage('');
        return waste && waste.scales ? (waste.scales == "4Kg" ? "Silakan Gunakan Timbangan 4Kg" : "Silakan Gunakan Timbangan 50 Kg") : "";
    }

    /*     const getScaleName = () => {
            let scaleMessage = "";
            if (waste && waste.scales) {
                scaleMessage = waste.scales === "4Kg" ? "Silakan Gunakan Timbangan 4Kg" : "Silakan Gunakan Timbangan 50 Kg";
            }
            
            if (scaleMessage) {
                setmessage(scaleMessage);
                setTimeout(() => {
                    setmessage("");
                }, 3000); // Menghapus pesan setelah 3 detik
            }
            
            return () => clearTimeout(timer); 
        };*/
    const saveTransaksiRack = async (_container, binName, type) => {
        const _finalNeto = _container.waste.scales == "4Kg" ? neto4Kg : neto50Kg;
        const res = await apiClient.post(`http://${rackTarget}/Transaksi`, { name: binName,containerName: transactionData.toBin ? transactionData?.toBin : _container.name,waste:_container.waste.name,payload: {
            badgeId: user.badgeId,
//            idContainer: _container.containerId,
//            IdWaste: _container.IdWaste,
            type: type,
            idqrmachine: binName,
            weight: _finalNeto
        }
        });
        if (res.data && res.data.msg) {
            const data = res.data.msg;
            const isSuccess = await sendDataPanasonicServer(data.station && type!='Collection' ? data.station :  _container.station ,transactionData.toBin ? transactionData?.toBin :  _container.name, binName, data.weight, type);
            await apiClient.post("http://localhost:5000/SaveTransaksi", {
                payload: {
                    idContainer: _container.containerId,
                    badgeId: user.badgeId,
                    IdWaste: _container.IdWaste,
                    type: data.type,
                    weight: data.weight,
                    success : isSuccess
                }
            });
//            updateBinWeight();
//            setWaste(null);
            setTransactionData({});
            setScanData('');
            setUser(null);
            setContainer(null);
            setmessage('');
            setNeto(0);
            freezeNeto(false);
            setFinalStep(false);
            setIsSubmitAllowed(false);
            setIdbin(-1);
            setScanData('');
            setinstruksimsg('');
        }
    }
    const sendWeight = async (name,weight)=>{
        try {
            const response = await apiClient.post(`http://${apiTarget}/api/pid/sendWeight`, {
                binname: name,
                weight: weight,
            });
            if (response.status != 200) {
                return;
            }
        }
        catch (error) {
        }
    }
    const saveTransaksi = async () => {
        const _finalNeto = getWeight(); //neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
        const _p = {
            payload: {
                idContainer: container.containerId,
                badgeId: user.badgeId,
                IdWaste: container.IdWaste,
                type: type,
                weight: _finalNeto
            }
        };

        const isSuccess = await sendDataPanasonicServer(container.station, transactionData.toBin ? transactionData?.toBin : container?.name, binDispose.name, _finalNeto, type);
        if (transactionData.idscraplog)
            _p.idscraplog = transactionData.idscraplog;
        _p.success = isSuccess;
        await apiClient.post("http://localhost:5000/SaveTransaksi", {
            ..._p
        });
//        setWaste(null);
        setScanData('');
        setinstruksimsg('');
    };
    const updateTransaksi = async (type)=>{
        await  updateTransaksiManual(transactionData.idscraplog,type,waste);
    }
    const updateTransaksiManual = async (_idscraplog,_type,_waste)=>
    {
        const _finalNeto = waste  ? getWeight() : (_waste.scales == '4Kg' ? neto4Kg : neto50Kg);
        const res = await apiClient.put("http://localhost:5000/Transaksi/"+_idscraplog,{
            type : _type,
            status: "Done",
            weight: _finalNeto,
            logindate: logindate
        });
//        setWaste(null);
        setScanData('');
        setinstruksimsg('');
    }
    const updateContainerstatus = async () => {
        //const _finalNeto = getWeight();
        try {
            const response = await apiClient.post(`http://localhost:5000/UpdateContainerStatus`, {
                containerName: container.name,
                status: ""

            });
            if (response.status != 200) {
                return;
            }
        }
        catch (error) {
        }
    }

    const saveTransaksiCollection =async (_container) => {
        
        const resAPI = await sendDataPanasonicServer(_container.station, _container.name, '', _container.weight, 'Collection');
        const res = await apiClient.post(`http://${process.env.REACT_APP_TIMBANGAN}/SaveTransaksiCollection`, {
            payload: {
                idContainer: _container.containerId,
                badgeId: user.badgeId,
                IdWaste: _container.IdWaste,
                type: _container.type,
                weight: _container.weight,
                success: resAPI
            }
        });
        setWaste(null);
        setScanData('');
    };

    const updateBinWeight = async () => {
        try {
            const _finalNeto = getWeight();//neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
            const response = await apiClient.post('http://localhost:5000/UpdateBinWeight', {
                binId: binDispose.id,
                neto: _finalNeto
            });
            
            /*setScanData('');
            setUser(null);
            setContainer(null);
            setmessage('');
            setNeto(0);
            freezeNeto(false);
            setFinalStep(false);
            setIsSubmitAllowed(false);
            setIdbin(-1);*/
            await sendGreenlampOff(binDispose.name_hostname);
            await sendYellowOn(binDispose.name_hostname);
        }
        catch (error) {
            console.log(error);
        }
    }

    const handleSubmit = async () => {
        setShowModal(false);
        const binWeight = container?.weightbin ?? 0;
        const totalWeight = parseFloat(neto) + parseFloat(binWeight);

        if (type == 'Dispose') {
            if (neto4Kg > 4) {
                alert("Berat limbah melebihi kapasitas maximum");
                return;
            } else if (neto50Kg > 50) {
                alert("Berat limbah melebihi kapasitas maximum");
                return;
            }
            if (!continueState)
            {
                if (container.waste.handletype=='Rack')
                {
                    let checkName = container.name;
                    if (transactionData.idscraplog)
                    {
                        checkName = transactionData.toBin;
                    }
                    await CheckBinCapacityRack(checkName);
                }
                else
                    await CheckBinCapacity();
            }
            setIsSubmitAllowed(false);
            setFinalStep(true);
            setmessage('');
            setmessage('Waiting For Verification');
            setShowModalDispose(true);
        }
    }

    const handleCancel = () => {
        toggleModal();
        freezeNeto(false);
    };
    const handleFormContinue = async (response)=>{
        toggleContinueModal(false);
        setScanData('');
        if (response)
        {
            if (transactionData.idscraplog)
                await updateTransaksi('Dispose');
            if (container.waste.handletype=="Rack" || waste.handletype =='Rack')
                await saveTransaksiRack( container,binDispose.name,'Dispose');
            else
            {
                const _finalNeto = getWeight();//neto50Kg > neto4Kg ? neto50Kg : neto4Kg;
                const response = await apiClient.post('http://localhost:5000/UpdateBinWeight', {
                    binId: binDispose.id,
                    neto: _finalNeto
                });
                await saveTransaksi();

            }
            freezeNeto(false);
            setmessage('');
            setNeto(0);
            setScanData('');
            setinstruksimsg('-');
            setContainer(null);
            setTransactionData({});
            setFinalStep(false);
        }
        else
        {
            setFinalStep(true);
        }
        inputRef.current.focus();
        setContinueState(response);
    }

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
                    {
                        (process.env.REACT_APP_4Kg== '1') &&
                        <div className={`grid grid-cols-1 grid-flow-row gap-3 col-span-${process.env.REACT_APP_50Kg=="1" ? '1' : '2'}  `}>
                            <div className="col-span-1 ...">
                                <div className='flex-1 p-4 border rounded bg-white'>
                                    <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Brutto</h1>
                                    <div className=''>
                                        <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{((Scales4Kg?.weight4Kg ?? 0) * 1000).toFixed(2) ?? 0}<FiRefreshCcw size={20} /></div>
                                        <p className='flex justify-center text-2xl font-bold'>Gram</p>
                                    </div>
                                </div>
                            </div>
                            <div className="row-span-1 col-span-1">
                                <div className='flex-1 p-4 border rounded bg-white'>
                                    <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Netto</h1>
                                    <div className=''>
                                        <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{(neto4Kg * 1000).toFixed(2)} <FiRefreshCcw size={20} /></div>
                                        <p className='flex justify-center text-2xl font-bold'>Gram</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    {
                        (process.env.REACT_APP_50Kg == '1') &&
                        <div className={`grid grid-cols-1 grid-flow-row gap-3 col-span-${process.env.REACT_APP_4Kg=="1" ? '1' : '2'} `}>
                            <div className="col-span-1 ...">
                                <div className='flex-1 p-4 border rounded bg-white'>
                                    <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Brutto</h1>
                                    <div className=''>
                                        <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{Scales50Kg?.weight50Kg?.toFixed(2) ?? 0}<FiRefreshCcw size={20} /></div>
                                        <p className='flex justify-center text-2xl font-bold'>Kilogram</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span- row-span-1">
                                <div className='flex-1 p-4 border rounded bg-white'>
                                    <h1 className='text-blue-600 font-semibold mb-2 text-xl'>Netto</h1>
                                    <div className=''>
                                        <div className='flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold'>{neto50Kg.toFixed(2)} <FiRefreshCcw size={20} /></div>
                                        <p className='flex justify-center text-2xl font-bold'>Kilogram</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    <div className={`row-span-1 col-span-1`}>
                        <div className=' p-4 border rounded bg-white h-full'>
                            <h1 className='text-blue-600 font-semibold text-xl mb-3'>Scanner Result</h1>
                            <p>Please Scan..</p>
                            <input
                                type="text"
                                autoFocus={true}
                                name="text"
                                id="userId"
                                value={scanData}
                                onKeyDown={e => handleKeyPress(e)}
                                ref={inputRef}
                                onChange={e => setScanData(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder=""
                            />
                            <button className='block w-full border rounded py-2 flex justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg' disabled={!isSubmitAllowed} onClick={toggleModal}>Submit</button>
                            <div className='text-lg mt-5'>
                                <p>Username: {user?.username} </p>
                                <p>Container Id: {transactionData.toBin ? transactionData?.toBin : container?.name}</p>
                                <p>Type Waste: {container?.waste.name}</p>
                            </div>
                        </div>
                    </div>
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
                                            {parseFloat(/*neto50Kg > neto4Kg ? neto50Kg : neto4Kg*/ getWeight()).toFixed(2)}Kg
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
                <div className='flex justify-start'>
                    {showContinueModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <p>Lakukan Proses Timbang Kembali?</p>
                                        <div className="flex justify-center mt-5">
                                            <button type="button" onClick={()=>handleFormContinue(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded">Ok</button>
                                            <button type="button" onClick={()=>handleFormContinue(false)} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex justify-start'>
                    {showModalDispose && (
                        <div className="fixed z-10 inset-0 overflow-y-auto" onKeyDown={handleKeyPressModal}>
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            Dispose Dialokasikan ke Bin: {binname} Waste:{wastename}</Typography>
                                        <div className="flex justify-center mt-5">
                                            <button type="button" autoFocus={true} onClick={() => {setShowModalDispose(false);toggleContinueModal(true);}} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Oke</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex justify-start'>
                    {(showModalInfoScale && process.env.REACT_APP_50Kg=='1' && process.env.REACT_APP_4Kg == '1') && (
                        <div className="fixed z-10 inset-0 overflow-y-auto" onKeyDown={handleKeyPressModal}>
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            {getScaleName()}</Typography>
                                        <div className="flex justify-center mt-5">
                                            <button type="button" autoFocus={true} onClick={() => setShowModalInfoScales(false)} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Oke</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p>Instruksi : {message} </p>
            </div>
            <footer className='flex-1 rounded border flex justify-center gap-40 p-3 bg-white'  >
                <p>Server Status: 192.168.1.5 Online</p>

            </footer>
        </main>
    );
};

export default Home;
