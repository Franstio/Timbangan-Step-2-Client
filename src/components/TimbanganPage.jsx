import React, {
    useState,
    useEffect,
    Fragment,
    useRef,
    cloneElement,
    useMemo,
} from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { IoSettingsOutline } from "react-icons/io5";
import { styled } from "@mui/material/styles";
import LinearProgress, {
    linearProgressClasses,
} from "@mui/material/LinearProgress";
import axios from "axios";
import io from "socket.io-client";
import {
    Container,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Grid,
} from "@mui/material";
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { IconButton } from '@mui/material';
import { InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useLocalStoragePath from 'use-local-storage-state';
import moment from 'moment';
import WeightIndicator from "./WeightIndicator";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}


const TimbanganPage = () => {

    const socketRef = useRef(null);
    const inputRef = useRef(null);
    const freezeRef = useRef(false);
    const btnSubmitRef = useRef(null);
    const apiClient = useRef(axios.create({
        withCredentials: false,
        timeout: 10000,
    }));

    const [scanData, setScanData] = useState('');

    const [user, setUser] = useLocalStoragePath('user', { defaultValue: null });
    const [containers, setContainers] = useLocalStoragePath("containers", { defaultValue: [] });
    const [container, setContainer] = useLocalStoragePath("container", { defaultValue: null });
    const [binDispose, setBinDispose] = useLocalStoragePath('binDispose', { defaultValue: null });

    const [isSubmitAllowed, setIsSubmitAllowed] = useLocalStoragePath("isSubmitAllowed", { defaultValue: false });;
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [continueState, setContinueState] = useState(false);
    const [isFinalStep, setFinalStep] = useLocalStoragePath("isFinalStep", { defaultValue: false });
    const [binOffline, setBinOffline] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [isFreeze, freezeNeto] = useState(false);
    const [refreshModal, setRefreshModal] = useState(false);
    const [refreshBinModal, setRefreshBinModal] = useState(false);
    const [showContinueModal, toggleContinueModal] = useState(false);
    const [showModalDispose, setShowModalDispose] = useState(false);
    const [allowContinueModal, setAllowContinueModal] = useState(false);
    const [showModalInfoScale, setShowModalInfoScales] = useState(false);
    const [showErrorDispose, setShowErrorDispose] = useState(false);
    const [showBinProblemMessage, setShowBinProblemMessage] = useState(false);
    const [binProblem, setBinProblem] = useState({ continue: false });
    const [errDisposeMessage, setErrDisposeMessage] = useState("");
    const [message, setmessage] = useLocalStoragePath("message", { defaultValue: "" });
    const [allowReload, setAllowReload] = useLocalStoragePath('allowReload', { defaultValue: true });

    const rackTarget = useRef(process.env.REACT_APP_RACK);
    const apiTarget = useRef(process.env.REACT_APP_PIDSG);
    const ipAddress = useRef(process.env.REACT_APP_PIDSG);

    const [transactionData, setTransactionData] = useLocalStoragePath("transactionData", { defaultValue: {} });
    const [logindate, setLoginDate] = useLocalStoragePath("logindate", { defaultValue: [] });
    const [checkInputInverval, setCheckInputInterval] = useState(null);
    const navigation = [{ name: "Dashboard", href: "#", current: true }];
    const [serverErr, setServerErr] = useState({ show: false, message: "" });
    const [serverActive, setServerActive] = useState(true);
    const [rackActive, setRackActive] = useState(true);
    const [restartModal, setRestartModal] = useState({ showModal: false, passwordInput: '', showPassword: false })
    const [availableBins, setAvailableBins] = useState([]);





    const [weight4Kg, setWeight4kg] = useLocalStoragePath('weight4Kg', { defaultValue: { weight: 0 } });
    const [weight50Kg, setWeight50kg] = useLocalStoragePath('weight50Kg', { defaultValue: { weight: 0 } });
    const neto4Kg = useMemo(() => getNeto(weight4Kg.weight * 1000), [weight4Kg.weight, container?.weightbin]);
    const neto50Kg = useMemo(() => getNeto(weight50Kg.weight), [weight50Kg.weight, container?.weightbin]);
    const scaleName = useMemo(() => getScaleName(container?.waste), [container?.waste]);
    const finalWeight = useMemo(() => getFinalWeight(container), [container?.waste, weight4Kg.weight, weight50Kg.weight]);
    const totalWeight = useMemo(() => getTotalWeight(containers), [container])

    function toggleModal() {
        freezeNeto(true);
        setShowConfirmModal(!showConfirmModal);
    }
    function getScaleName(wasteType) {
        return wasteType && wasteType.scales
            ? wasteType.scales == "4Kg"
                ? "Silakan Gunakan Timbangan 4Kg"
                : "Silakan Gunakan Timbangan 50 Kg"
            : "";
    }
    function getTotalWeight(containersData) {
        return containersData?.reduce((a, b) => a + b.dataWeight, 0) ?? 0;
    }
    async function checkProcessRunning() {

        if (!binDispose) return true;
        return await GetBinStatus(binDispose.name_hostname);
    };
    async function GetBinStatus(binName) {
        try {
            const res = await apiClient.current.get(
                `http://${binName}.local:5000/status`,
                {
                    timeout: 10 * 1000
                }
            );
            return res.data.isRunning;
        } catch {
            return null;
        }
    }

    async function GetBinStatusFull(binName) {
        try {
            const res = await apiClient.current.get(
                `http://${binName}.local:5000/status`,
                {
                    timeout: 3 * 1000
                }
            );
            return res.data;
        } catch {
            return null;
        }
    }

    function getNeto(weight) {
        const weightBin = parseFloat(container?.weightbin || 0);
        return weight - weightBin;
    }
    function getFinalWeight(cotnainerData) {
        console.log(cotnainerData);
        return cotnainerData?.waste?.scales == "4Kg" ? neto4Kg : neto50Kg;
    }
    async function checkAPI(url) {
        try {
            const res = await apiClient.current.get(`http://${url}/ping`, { timeout: 5000 });
            return res.status == 200;
        }
        catch {
            return false;
        }
    }

    useEffect(() => {
        if (!serverErr.show && !serverActive) {
            setServerErr({ show: true, message: "Server Disconnecting, Halting Application" });
            setTimeout(() => {
                setServerErr({ show: false, message: '' });
            }, 1000);
        }
        else if (serverErr.show && serverActive && rackActive)
            setServerErr({ show: false, message: '' });
    }, [serverActive])

    useEffect(() => {
        const socket = io(`http://${process.env.REACT_APP_TIMBANGAN}/`, {
            reconnection: true,
            autoConnect: true,
        });
        socketRef.current = socket;


        socket.on('data', (data) => {
            if (freezeRef.current)
                return;
            setWeight4kg({ weight: (data.weight / 1000) });
        });

        socket.on('data1', (data) => {
            if (freezeRef.current)
                return;
            setWeight50kg({ weight: data.weight50Kg });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        }
    }, []);

    useEffect(()=>{
        freezeRef.current = isFreeze;
    },[isFreeze]);

    useEffect(() => {
        const getStatus = async () => {
            try {
                const res = await apiClient.current.get(`http://${ipAddress}`);
                console.log(res);
                setIsOnline(res.status >= 200 && res.status < 300);
            } catch (er) {
                setIsOnline(false);
            }
        };
        const intervalObj = setInterval(() => getStatus(), 5000);
        return () => {
            clearInterval(intervalObj);
        };
    }, []);

    useEffect(() => {
        const updateFocus = () => {
            if (inputRef && inputRef.current) {
                setRestartModal(r => {
                    if (document.activeElement != inputRef.current && !r.showModal)
                        inputRef.current.focus();
                    return r;
                });
            }
        };
        const interval1 = setInterval(updateFocus, 1000);
        return () => {
            clearInterval(interval1);
        };
    }, []);

    useEffect(() => {
        if (user == null || container == null) setScanData("");
    }, [user, container]);

    useEffect(() => {
        if (errDisposeMessage != "") setShowErrorDispose(true);
    }, [errDisposeMessage]);

    useEffect(() => {
        if (!showErrorDispose) {
            if (!allowContinueModal && inputRef.current) {
                inputRef.current.focus();
            }
            setErrDisposeMessage("");
        }
    }, [showErrorDispose]);

    useEffect(() => {
        if (!showModalDispose && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showModalDispose]);


    useEffect(() => {
        if (!showModalInfoScale && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showModalInfoScale]);



    const handleKeyPressModal = (e) => {
        if (e.key === "Enter") {
            setShowModalInfoScales(false);
            setShowModalDispose(false);
        }
    };


    const RestartSystem = async () => {
        try {
            await apiClient.current.get(`http://localhost:5000/restart`);
        }
        catch (er) {
            console.log(er);
        }
    }
    const resetBin = async () => {
        if (binDispose && binDispose.name_hostname) {
            await apiClient.current.get(`http://${binDispose.name_hostname}.local:5000/clear-bin`);
        }
    }

    const handleKeyPress = async (e) => {
        try {
            const check = await checkAPI("localhost:5000");
            if (!check) {
                setServerActive(check);
                return;
            }
            if (e.key === "Enter") {
                if (inputRef.current) inputRef.current.disabled = true;
                if (user == null) handleScanBadge();
                else if (isFinalStep) {
                    await verifProcess(false);
                } else if (container == null) {
                    handleScanMachine();
                }
            }
        } catch {
            if (inputRef.current) inputRef.current.disabled = false;
        } finally {
            if (inputRef.current) inputRef.current.disabled = false;
        }
    };

    const handleScanBadge = async () => {
        try {
            const res = await apiClient.current.post("http://localhost:5000/ScanBadgeid", { badgeId: scanData });
            if (res.data.user) {
                setUser(res.data.user);
                setmessage("Scan Bin Machine/Bin");
            }
            else {
                setUser(null);
            }
            setScanData("");
        }
        catch {
            setScanData("");
            setUser(null);
        }
    }
    const verifyBadge = async (station) => {
        if (!user || !user.badgeId) return false;
        try {
            if (!isOnline) return false;
            const res = await apiClient.current.get(
                `http://${apiTarget}/api/pid/pibadgeverify?f1=${station}&f2=${user.badgeId}`,
                {
                    timeout: 1000,
                }
            );
            return true;
        } catch (err) {
            return (
                err.message.includes("Network Error") || err.code == "ECONNABORTED"
            );
        }
    };
    const saveTransaksiRack = async (_container, binName, type, binId) => {
        const _finalNeto = _container.waste.scales == "4Kg" ? neto4Kg : neto50Kg;
        const res = await apiClient.current.post(
            `http://${rackTarget.current}/Transaksi`,
            {
                name: binName,
                containerName: transactionData.toBin
                    ? transactionData?.toBin
                    : _container.name,
                waste: _container.waste.name,
                payload: {
                    badgeId: user.badgeId,
                    type: type,
                    idqrmachine: binName,
                    weight: _finalNeto,
                },
            },
            {
                timeout: 10000,
            }
        );
        if (res.data && res.data.msg) {
            const data = res.data.msg;
            if (type == 'Collection') {
                await apiClient.current.post(`http://localhost:5000/SaveTransaksiCollection`, {
                    payload: {
                        idContainer: _container.containerId,
                        badgeId: user.badgeId,
                        IdWaste: _container.IdWaste,
                        type: data.type,
                        idscraplog: transactionData?.idscraplog ?? "",
                        weight: 0,
                        success: false,
                        status: _container.status,
                        fromContainer: type == "Collection" ? _container.name : (transactionData?.toBin ?? _container.name),
                        toBin: type == "Collection" ? undefined : binname
                    },
                    station: data.station && type != "Collection"
                        ? data.station
                        : _container.station,
                    logindate: moment().format("YYYY-MM-DD HH:mm:ss"),
                    binId: binId
                });
                setWaste(null);
                setTransactionData({});
                setScanData("");
                setUser(null);
                setContainer(null);
                setmessage("");
                freezeNeto(false);
                setFinalStep(false);
                setIsSubmitAllowed(false);
                setScanData("");
                return [];
            }
            else {
                return [
                    {
                        idContainer: _container.containerId,
                        badgeId: user.badgeId,
                        IdWaste: _container.IdWaste,
                        type: data.type,
                        idscraplog: transactionData?.idscraplog ?? "",
                        weight: _finalNeto,
                        success: false,
                        status: _container.status,
                        fromContainer: (transactionData?.toBin ?? _container.name),
                        toBin: binName,
                        station: data.station && type != "Collection"
                            ? data.station
                            : _container.station,
                    }
                ]
            }
        }
    };
    const saveTransaksiCollection = async (_container, binId) => {
        const res = await apiClient.current.post(
            `http://${process.env.REACT_APP_TIMBANGAN}/SaveTransaksiCollection`,
            {
                payload: {
                    idContainer: _container.containerId,
                    badgeId: user.badgeId,
                    IdWaste: _container.IdWaste,
                    type: _container.type,
                    weight: _container.weight,
                    success: false,
                    status: "",
                    fromContainer: _container.name
                },
                station: _container.station,
                binId: binId
            }
        );
        setWaste(null);
        setScanData("");
    }
    const handleScanMachine = async () => {
        try {
            if (containers.length > 0) {
                const checkIndex = containers.findIndex(
                    (x) => x.dataContainer?.name.toLowerCase() == scanData.toLowerCase()
                );
                if (checkIndex != -1) {
                    setAllowContinueModal(true);
                    setErrDisposeMessage("Bin telah di scan mohon scan bin yang lain");
                    return;
                }
            }
            const res = await apiClient.current.post("http://localhost:5000/ScanContainer", {
                containerId: scanData,
            });
            console.log(res.data.container);
            
            if (!res.data.container) {
                setErrDisposeMessage("Container not found");
                setUser(null);
                setContainer(null);
                setScanData("");
                setIsSubmitAllowed(false);
                return;
            }

            if (res.data.container.waste.handletype == 'Rack') {
                const rackCheck = await checkAPI(rackTarget.current);
                setRackActive(rackCheck);
                if (!rackCheck) return;
            }
            const badgeCheck = await verifyBadge(res.data.container.station);
            if (containers.length > 0 && res.data.container.IdWaste != containers[0].dataContainer.IdWaste) {
                setErrDisposeMessage("Waste Mismatch");
                setScanData("");
                return;
            }

            if (res.data.container?.type == 'Collection') {
                if (!user.OUT) {
                    setErrDisposeMessage("Unauthorized User for Collection");
                    setUser(null);
                    setScanData("");
                    return;
                }
                if (continueState) {
                    setErrDisposeMessage("Collection Transaction is not allowed");
                    return;
                }
                const _bin = res.data.container.waste.bin.find(
                    (item) => item.name == res.data.container.name
                );

                const checkProcess = await GetBinStatus(_bin.name_hostname);
                const isRack = res.data.container.waste.handletype == "Rack";
                if (checkProcess == null && !isRack) {
                    setBinOffline(true);
                    return;
                }
                if (checkProcess) {
                    setErrDisposeMessage("Transaction Process Haven't completed yet, Please Submit Again after bin transaction completed.");
                    return;
                }
                if (!_bin) {
                    setErrDisposeMessage("Bin Collection error");
                    return;
                }
                _bin.type = "Collection";

                let collectionPayload = {
                    ...res.data.container,
                    weight: _bin.weight,
                };

                if (!isRack) {
                    try {
                        const resData = await apiClient.current.post(
                            `http://${_bin.name_hostname}.local:5000/Start`,
                            { bin: _bin }
                        );
                    }
                    catch {
                        setBinOffline(true);
                        setContainer(null);
                        return;
                    }
                }

                if (isRack)
                    await saveTransaksiRack(collectionPayload, "", "Collection", _bin.id);
                else
                    await saveTransaksiCollection(collectionPayload, _bin.id);

                setShowConfirmModal(false);
                setScanData("");
                setUser(null);
                setContainer(null);
                setContainers([]);
                setmessage("");
            }
            else {
                setmessage(scaleName);
                if (!user.IN) {
                    setErrDisposeMessage("Unauthorized User For Dispose");
                    setUser(null);
                    setScanData("");
                    return;
                }
                if (res.data.container.waste.step1) {
                    try {
                        const checkTr = await apiClient.current.get(
                            "http://localhost:5000/Transaksi/" + scanData
                        );
                        const tr = checkTr.data;
                        setTransactionData(tr);
                    } catch (err) {
                        setErrDisposeMessage("Step-1 Data Not Registered in Current step-2. Synchronizing data, please retry transaction from start.");
                        setUser(null);
                        setScanData("");
                        return;
                    }
                }
                else setTransactionData({});

                setContainer(res.data.container);
                setShowModalInfoScales(true);
                setIsSubmitAllowed(true);
            }
            setScanData("");

        }
        catch (er) {
            console.log(er)
        }
    }

    const handleCancel = () => {
        toggleModal();
        freezeNeto(false);
    };

    const handleSubmit = async () => {
        if (btnSubmitRef.current) btnSubmitRef.current.disabled = true;
        setShowConfirmModal(false);
        try {
            if (neto4Kg > 4) {
                setErrDisposeMessage("Berat limbah melebihi kapasitas maximum");
                return;
            } else if (neto50Kg > 50) {
                setErrDisposeMessage("Berat limbah melebihi kapasitas maximum");
                return;
            }
            let checkBinAvailable = binDispose;
            let availableBinsData = [];
            if (!continueState || binDispose == null) {
                if (container.waste.handletype == "Rack") {
                    let checkName = container.name;
                    if (transactionData.idscraplog) {
                        checkName = transactionData.toBin;
                    }
                    checkBinAvailable = await CheckBinCapacityRack(checkName);
                } else {
                    const res = await CheckBinCapacity();
                    checkBinAvailable = null;
                    availableBinsData = res.bins;
                    for (let i = 0; i < availableBinsData.length; i++) {
                        let statusBin = await GetBinStatusFull(availableBinsData[i].name_hostname);
                        if (statusBin == null || statusBin.isRunning)
                            continue;
                        else {
                            checkBinAvailable = availableBinsData[i];
                            break;
                        }
                    }

                }
            }
            setBinDispose(checkBinAvailable);

            if (checkBinAvailable == null && container.waste.handletype != 'Rack') {
                setErrDisposeMessage("No Bin Available");
                setContainer(null);
                return;
            }
            if (!checkBinAvailable) {
                setContainer(null);
                return;
            }
            if (checkBinAvailable.name_hostname && container.waste.handletype != 'Rack') {
                const checkProcess = await GetBinStatus(checkBinAvailable.name_hostname);
                if (checkProcess == null) {
                    setBinOffline(true);
                    return;
                }
                if (checkProcess) {
                    setErrDisposeMessage("Transaction Process Haven't completed yet, Please Submit Again after bin transaction completed.");
                    return false;
                }
            }
            const curWeight =
                totalWeight + finalWeight + parseFloat(checkBinAvailable.weight);
            if (curWeight >= parseInt(checkBinAvailable.max_weight)) {
                setAllowContinueModal(true);
                setErrDisposeMessage("Berat Timbangan Melebihi Kapasitas Maksimum");
                return;
            }
            if (
                curWeight <= parseFloat(checkBinAvailable?.max_weight ?? 100) &&
                container != null &&
                checkBinAvailable != null &&
                containers.findIndex(x => x.dataContainer.name == container.name) == -1
            ) {

                setContainers([
                    ...containers,
                    {
                        dtSubmit: moment().format("YYYY-MM-DD HH:mm:ss"),
                        dataContainer: container,
                        dataWeight: finalWeight,
                        dataTransaction: transactionData,
                    },
                ]);
            }
            setIsSubmitAllowed(false);
            setmessage("");
            if (container.waste.handletype == "Rack") {
                console.log(binDispose);
                setFinalStep(true);
                setmessage("Waiting For Verification");
                setShowModalDispose(true);
                inputRef.current.focus();
                setAllowContinueModal(false);
                setContinueState(false);
            } else toggleContinueModal(true);

        } catch {
            if (btnSubmitRef.current) btnSubmitRef.current.disabled = false;
        } finally {
            if (btnSubmitRef.current) btnSubmitRef.current.disabled = false;
        }
    };


    const CheckBinCapacity = async () => {
        const _finalNeto = finalWeight;
        try {
            const url =
                container.waste.handletype == "Rack" ? rackTarget : "localhost:5000";
            const response = await apiClient.current.post(`http://${url}/CheckBinCapacity`, {
                IdWaste: container.IdWaste,
                neto: _finalNeto,
            });

            const res = response.data;
            if (!res.success) {
                setAllowContinueModal(true);
                setErrDisposeMessage(res.message);
                return false;
            }
            res.bin.type = "Dispose";
            return res;
        } catch (error) {
            return null;
        }
    }

    const CheckBinCapacityRack = async (data) => {
        try {
            const lines = data.trim().split("-");
            const line = lines[lines.length - 2];
            const res = await apiClient.current.post(
                `http://${rackTarget}/CheckBinCapacity`,
                {
                    line: line,
                    weight: finalWeight
                },
                {
                    timeout: 10000,
                }
            );
            const bin = res.data.bins[0];
            const _res = await apiClient.current.get(`http://localhost:5000/bin/` + bin.name);
            bin.id = _res.data.bin.id;
            setBinDispose(bin);
            return bin;
        } catch (err) {
            setAllowContinueModal(true);
            setErrDisposeMessage("Bin From Rack Not Available");
            return null;
        }
    }

    const handleFormContinue = async (response) => {
        toggleContinueModal(false);
        setScanData("");
        if (response || containers.length < 1) {
            setAllowReload(false);
            setIsSubmitAllowed(false);
            freezeNeto(false);
            setmessage("");
            setScanData("");
            setinstruksimsg("-");
            setContainer(null);
            setTransactionData({});
            setFinalStep(false);
        } else {
            setAllowReload(true);
            try {
                if (containers[0].dataContainer.waste.handletype != "Rack") {
                    const resData = await apiClient.current.post(
                        `http://localhost:5000/Start`,
                        { bin: binDispose },
                        {
                            timeout: 10 * 1000
                        }
                    );
                }
                setFinalStep(true);
                setmessage("Waiting For Verification");
                setShowModalDispose(true);
                setAllowContinueModal(false);
            } catch (err) {
                console.log(err);
                await RefreshNetwork();
                setFinalStep(false);
                setIsSubmitAllowed(true);
                setScanData("");
                setAllowContinueModal(true);
            }
        }
        inputRef.current.focus();
        setContinueState(response);
    };

    const BuildDisposePayload = (dataInput) => {
        const { dataContainer, dataWeight, dataTransaction, dtSubmit } = dataInput;
        
        const _finalNeto = dataWeight;
        
        const _p = {
            idContainer: dataContainer.containerId,
            badgeId: user.badgeId,
            IdWaste: dataContainer.IdWaste,
            type: type,
            weight: _finalNeto,
            toBin: binDispose.name,
            status: "Done",
            fromContainer: dataTransaction?.toBin
                ? dataTransaction?.toBin
                : dataContainer.name,
            station: dataContainer.station,
            recordDate: dtSubmit
        };
        
        if (dataTransaction.idscraplog)
            _p.idscraplog = dataTransaction.idscraplog;

        _p.success = false;

        if (!_p.success) _p.status = "Pending|PIDSG";

        return { ..._p };
    }
    const verifProcess = async (disabled) => {
        if (binDispose.name != scanData) {
            setErrDisposeMessage("mismatch name");
            setScanData("");
            return;
        }
        let check = true;
        const isRack = containers[0].dataContainer.waste.handletype == "Rack";
        if (isRack) {
            
            const rackCheck = await checkAPI(rackTarget);
            setRackActive(rackCheck);
            if (!rackCheck)
                return;

        }
        else {
            const checkProcess = await checkProcessRunning();
            if (checkProcess && !binProblem.continue) {
                setErrDisposeMessage("Transaction Process Haven't completed yet");
                return;
            }
            console.log({ verification: containers, binDispose: binDispose });
            binDispose.weight =
                finalWeight + parseFloat(binDispose.weight);
        }
        const payloads = [];
        for (let i = 0; i < containers.length; i++) {
            if (isRack || waste.handletype == "Rack") {
                const res = await saveTransaksiRack(containers[i].dataContainer, binDispose.name, "Dispose", binDispose.id);
                if (res.length > 0)
                    payloads.push(res[0])
            }
            else {
                payloads.push(
                    BuildDisposePayload(containers[i])
                );
            }
        }
        await saveTransaksi(payloads, disabled);
        setmessage("DATA TELAH MASUK");
        setContainers([]);
        setTypeCollection(null);
        setBinDispose(null);
        setFinalStep(false);
        setWaste(null);
        setBinProblem({ continue: false });
        setTimeout(async () => {
            setmessage("");
        }, 700);
    }


    const saveTransaksi = async (payloads,disabled) => {
        const _p = {
          payload: [...payloads],
          binId:binDispose.id,
          disabled: disabled ? 1: 0
        };
        try
        {
          await apiClient.current.post(
            "http://localhost:5000/SaveTransaksi",
            {
              ..._p,
            },
            {
              timeout: 20000,
            }
          );
        }
        catch (e)
        {
          console.log(e);
        }
      }
    
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
                                            <a
                                                href="/Timbangan"
                                                className={classNames(
                                                    "bg-gray-900 text-white",
                                                    "rounded-md px-3 py-2 text-sm font-medium"
                                                )}
                                                aria-current={"page"}
                                            >
                                                Step 2
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Disclosure.Panel className="sm:hidden">
                            <div className="space-y-1 px-2 pb-3 pt-2">
                                <Disclosure.Button
                                    as="a"
                                    href="/Timbangan"
                                    className={classNames(
                                        "bg-gray-900 text-white",
                                        "block rounded-md px-3 py-2 text-base font-medium"
                                    )}
                                    aria-current={"page"}
                                >
                                    Timbangan
                                </Disclosure.Button>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
            <div className="bg-[#f4f6f9] p-5">
                <div className="grid grid-cols-3 grid-flow-col gap-5">
                    {process.env.REACT_APP_4Kg == "1" && (
                        <WeightIndicator weight={(weight4Kg.weight * 1000)} neto={neto4Kg} unitType={"Gram"} />
                    )}

                    {process.env.REACT_APP_50Kg == "1" && (
                        <WeightIndicator weight={weight50Kg.weight} neto={neto50Kg} unitType={"Kilogram"} />
                    )}
                    <div className={`row-span-1 col-span-1`}>
                        <div className=" p-4 border rounded bg-white h-full">
                            <h1 className="text-blue-600 font-semibold text-xl mb-3">
                                Scanner Result
                            </h1>
                            <p>Please Scan..</p>
                            <input
                                type="text"
                                autoFocus={true}
                                name="text"
                                autoComplete="off"
                                id="userId"
                                value={scanData}
                                onBlur={() => {
                                    if (inputRef && inputRef.current && !restartModal.showModal) inputRef.current.focus();
                                }}
                                onKeyDown={(e) => handleKeyPress(e)}
                                ref={inputRef}
                                onChange={(e) => setScanData(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder=""
                            />
                            <button
                                className="block w-full border rounded py-2 flex justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg"
                                disabled={!isSubmitAllowed}
                                onClick={toggleModal}
                            >
                                Submit
                            </button>
                            <div className="text-lg mt-5">
                                <p>Username: {user?.username} </p>
                                <p>
                                    Container Id:{" "}
                                    {transactionData.toBin
                                        ? transactionData?.toBin
                                        : container?.name}
                                </p>
                                <p>Type Waste: {container?.waste.name}</p>
                                <p>Waste Item:</p>
                                {containers.map((item, index) => (
                                    <>
                                        <p>
                                            {index + 1}. {item.dataContainer.name}{" "}
                                            {parseFloat(item.dataWeight).toFixed(2)} Kg
                                        </p>
                                    </>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-start">
                    {showConfirmModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            {parseFloat(
                                                finalWeight
                                            ).toFixed(2)}
                                            Kg
                                        </Typography>
                                        <p>Data Timbangan Sudah Sesuai?</p>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                ref={btnSubmitRef}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded"
                                            >
                                                Ok
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {showContinueModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <span className="text-2xl">
                                            Apakah anda ingin menimbang lagi? (Item sejenis)
                                        </span>
                                        <div className="flex justify-center gap-8 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => handleFormContinue(true)}
                                                className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                                            >
                                                Iya
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFormContinue(false)}
                                                className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                                            >
                                                Tidak
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-start">
                    {refreshModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <span className="text-2xl">
                                            Apakah benar mau di refresh?
                                        </span>
                                        <div className="flex justify-center gap-8 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => { RestartSystem(); setRefreshModal(false); }}
                                                className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                                            >
                                                Iya
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRefreshModal(false)}
                                                className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                                            >
                                                Tidak
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {refreshBinModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-10 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <span className="text-2xl">
                                            Apakah benar anda ingin reset {binDispose?.name_hostname ?? ""} ?
                                        </span>
                                        <div className="flex justify-center gap-8 mt-5">
                                            <button
                                                type="button"
                                                onClick={() => { reloadBin(true); setRefreshBinModal(false); }}
                                                className="bg-blue-500 hover:bg-blue-600 text-2xl text-white font-bold py-3 px-5 mr-2 rounded"
                                            >
                                                Iya
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRefreshBinModal(false)}
                                                className="bg-gray-500 hover:bg-red-600 text-2xl text-white font-bold py-3 px-5 rounded"
                                            >
                                                Tidak
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {showErrorDispose && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <p>{errDisposeMessage}</p>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowErrorDispose(false);
                                                    if (allowContinueModal) toggleContinueModal(true);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {binOffline && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <p>Bin Offline</p>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBinOffline(false);
                                                    setScanData("");
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {showModalDispose && (
                        <div
                            className="fixed z-10 inset-0 overflow-y-auto"
                            onKeyDown={handleKeyPressModal}
                        >
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            Dispose Dialokasikan ke Bin: {binDispose?.name} Waste:{container?.waste?.name}
                                        </Typography>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                autoFocus={true}
                                                onClick={() => {
                                                    setShowModalDispose(false);
                                                }}
                                                className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Oke
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {showBinProblemMessage && (
                        <div
                            className="fixed z-10 inset-0 overflow-y-auto"
                            onKeyDown={handleKeyPressModal}
                        >
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            Bin {binDispose.name} Belum Selesai Transaksi.
                                        </Typography>
                                        <div className="flex justify-center gap-2 mt-5">
                                            <button
                                                type="button"
                                                autoFocus={true}
                                                onClick={() => {
                                                    setShowBinProblemMessage(false);
                                                    setBinProblem({ continue: false });
                                                    resetBin();
                                                }}
                                                className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Ulangi Proses Transaksi di Bin
                                            </button>
                                            <button
                                                type="button"
                                                autoFocus={true}
                                                onClick={() => {

                                                    setShowBinProblemMessage(false);
                                                    setBinProblem({ continue: true });
                                                    verifProcess(true);
                                                }}
                                                className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Tetap Lanjutkan Verifikasi
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-start">
                    {serverErr.show && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    aria-hidden="true"
                                ></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4"></div>
                                    <form>
                                        <p>{serverErr.message}</p>
                                        <div className="flex justify-center mt-5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setServerErr((prev) => ({ show: false, message: '' }));
                                                    setServerActive(true);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 mr-2 rounded"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-start">
                    {showModalInfoScale &&
                        process.env.REACT_APP_50Kg == "1" &&
                        process.env.REACT_APP_4Kg == "1" && (
                            <div
                                className="fixed z-10 inset-0 overflow-y-auto"
                                onKeyDown={handleKeyPressModal}
                            >
                                <div className="flex items-center justify-center min-h-screen">
                                    <div
                                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                        aria-hidden="true"
                                    ></div>

                                    <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                        <div className="text-center mb-4"></div>
                                        <form>
                                            <Typography variant="h4" align="center" gutterBottom>
                                                {scaleName}
                                            </Typography>
                                            <div className="flex justify-center mt-5">
                                                <button
                                                    type="button"
                                                    autoFocus={true}
                                                    onClick={() => setShowModalInfoScales(false)}
                                                    className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Oke
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    {restartModal.showModal && (
                        <div className="fixed z-10 inset-0 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                                <div className="bg-white rounded p-8 max-w-md mx-auto z-50">
                                    <div className="text-center mb-4">

                                    </div>
                                    <form>
                                        <Typography variant="h4" align="center" gutterBottom>
                                            Masukkan password untuk melakukan restart.
                                        </Typography>

                                        <TextField
                                            type={restartModal.showPassword ? 'text' : 'password'}
                                            label="Pin"
                                            value={restartModal.passwordInput}
                                            onChange={(e) => setRestartModal({ ...restartModal, passwordInput: e.target.value })}
                                            variant="outlined"
                                            fullWidth
                                            autoFocus={true}
                                            margin="normal"
                                            required
                                            focused
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setRestartModal({ ...restartModal, showPassword: !restartModal.showPassword })}>
                                                            {restartModal.showPassword ? <Visibility /> : <VisibilityOff />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        <div className="flex justify-center mt-5">
                                            <button type="button" onClick={handleRestart} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 mr-2 rounded">Ok</button>
                                            <button type="button" onClick={() => setRestartModal({ ...restartModal, showModal: false })} className="bg-gray-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                        </div>
                                    </form>
                                    <Keyboard
                                        onChange={(e) => setRestartModal({ ...restartModal, passwordInput: e.target?.value ?? e })}
                                        layout={{
                                            default: [
                                                "1 2 3",
                                                "4 5 6",
                                                "7 8 9",
                                                "0 {bksp}"
                                            ]
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p>Instruksi : {message} </p>
            </div>
            <footer className="flex-1 rounded border flex flex-col justify-center gap-1 p-3 bg-white">
                <p className="text-center">
                    Server Status: {ipAddress.current} {isOnline ? "Online" : "Offline"}
                </p>

                {process.env.REACT_APP_VERSION && <p>Version : {process.env.REACT_APP_VERSION} </p>}
                <div className="flex gap-3 flex-row w-100 justify-end pe-5">
                    {
                        binDispose?.name_hostname &&
                        <button

                            onClick={() => setRefreshBinModal(true)}
                            className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg`}
                        >Reset Bin</button>
                    }
                    <button
                        onClick={() => refreshPage()}
                        className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg`}
                    >Refresh</button>
                    <button
                        onClick={() => setRestartModal({ ...restartModal, showModal: true })}
                        className={`p-3 border rounded py-2 w-100  justify-center items-center font-bold mt-5 bg-sky-400 text-white text-lg`}
                    >Restart</button>
                </div>


            </footer>
        </main>
    );
}

export default TimbanganPage;