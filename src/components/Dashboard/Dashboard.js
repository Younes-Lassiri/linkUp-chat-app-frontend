import './Dashboard.css';
import { axiosClient } from '../../api/axios';
import { useContext, useEffect, useState, useRef } from 'react';
import { UserContext } from '../../context/UserContext';
import logo from './images/logo.svg';
import Loader from '../../Loader/Loader';
import { Howl } from 'howler';
import sentsound from './images/sent_sound.mp3';
import 'boxicons'
import { useNavigate } from 'react-router-dom'
const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesFormatted} ${ampm}`;
  };
export default function Dashboard() {
    const { user, setUser, logged, setLogged, loginLoading, setLoginLoading } = useContext(UserContext);
    const [activeChat, setActiveChat] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [fetchDone, setfetchDone] = useState(false);
    const [onlineDone, setonlineDone] = useState(false);
    const [friendDone, setfriendDone] = useState(false);
    async function getOnlineUsers(){
        setonlineDone(false);
        setOnlineUsers([]);
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.get('/api/online-users');
            setOnlineUsers(response.data);
            setonlineDone(true);
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        getOnlineUsers();
    },[])
      useEffect(() => {
        const intervalId = setInterval(() => {
            axiosClient.post('/api/user/activity');
        }, 30000);
    
        return () => clearInterval(intervalId);
    }, []);
    const navigate = useNavigate();
    const [statusProfile, setStatusProfile] = useState(false);
    const [clicked, setClicked] = useState(false);
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
    
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setUser({ ...user, picture: tempUrl });
    
            const formData = new FormData();
            formData.append('picture', file);
    
            try {
                await axiosClient.get('/sanctum/csrf-cookie');
                const response = await axiosClient.post('/api/upload-picture', formData);
                const updatedPictureUrl = response.data.pictureUrl; 
    
                if (updatedPictureUrl) {
                    setUser({ ...user, picture: updatedPictureUrl });
                }
            } catch (error) {
                console.error('Error uploading picture', error);
            }
        }
    };
    const [isMobile, setIsMobile] = useState(0);
    const updateIsMobile = () => {
        const mobileBreakpoint = 768;
        if (window.innerWidth <= mobileBreakpoint) {
          setIsMobile(1);
        } else {
          setIsMobile(0);
        }
      };
      useEffect(() => {
        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);
        return () => {
          window.removeEventListener('resize', updateIsMobile);
        };
      }, []);
    const [messages, setMessages] = useState([]);
    const [selectedFriend, setselectedFriend] = useState({});
    const [requests,setRequests] = useState([]);
    const [content, setContent] = useState('');
    const [about,setAbout] = useState(false);
    const [selected, setSelected] = useState('chats');
    const [users, setUsers] = useState([]);
    const [show, setShow] = useState(0);
    const [showinvitation, setShowinvitation] = useState(0);
    const [friends, setFriends] = useState([]);
    async function addFriend(id) {
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.post('/api/add-friend', { id });
    
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    }
    function sentSound() {
        var sound = new Howl({
            src: [sentsound]
        });
        sound.play();
    }
    async function sendMessageTo(receiver_id, receiver_name) {
        if (content.trim() !== '') {
            const timestamp = new Date().toISOString();
            const mess = {
                content: content,
                sender_id: user.id,
                receiver_id: receiver_id,
                sender_name: user.name,
                receiver_name: receiver_name,
                created_at: timestamp
            };
            try {
                await axiosClient.get('/sanctum/csrf-cookie');
                await axiosClient.post('/api/send-message', mess);
                setMessages(prevMessages => [...prevMessages, mess]);
                setContent('');
                sentSound();
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        }
    }
    async function acceptFriend(id) {
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.post('/api/accept-request', { id });
            setRequests(prevRequests => prevRequests.filter(request => request.id !== id));
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    }
    const fetchFriends = async () => {
        setfriendDone(false);
        setFriends([]);
        await axiosClient.get('/sanctum/csrf-cookie');
        const response = await axiosClient.get('/api/friends');
        setFriends(response.data);
        setfriendDone(true);
    }
    useEffect(() => {
        fetchFriends();
    },[]);
    async function getMessages(friend) {
        setMessages([]);
        setselectedFriend(friend);
        setfetchDone(false);
        setActiveChat(true);
        const element = document.querySelector('.dashboard-page-three');
        if (element) {
            if (isMobile === 1) {
                element.classList.remove('dashboard-page-three');
                element.classList.add('dashboard-page-three-is-mobile');
            }
        } else {
            console.warn('Element with class .dashboard-page-three not found.');
        }
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.get('/api/messages', {
                params: { friendId: friend.id }
            });
            setMessages(response.data);
            setfetchDone(true);
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }
    async function getMessagesReload(friend) {
        setselectedFriend(friend);
        setActiveChat(true);
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.get('/api/messages', {
                params: { friendId: friend.id }
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }
    useEffect(() => {
        if (activeChat) {
            const fetchMessages = () => {
                getMessagesReload(selectedFriend);
            };
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedFriend,activeChat]);
    const logout = async () => {
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            await axiosClient.post('/api/logout');
            setUser(null);
            setLogged(false);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error.response?.data || error.message);
        }
    };
    function hideChat() {
        const element = document.querySelector('.dashboard-page-three-is-mobile');
        if (element) {
            const style = document.createElement('style');
            style.type = 'text/css';
            const keyframes = `
                @keyframes hideMessages {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(100%);
                    }
                }
                .dashboard-page-three-is-mobile.hide-animation {
                    animation: hideMessages 0.5s forwards;
                }
            `;
            style.innerHTML = keyframes;
            document.head.appendChild(style);
            element.classList.add('hide-animation');
            element.addEventListener('animationend', () => {
                element.classList.add('dashboard-page-three');
                element.classList.remove('dashboard-page-three-is-mobile', 'hide-animation');
            }, { once: true });
        }
    }
    
    useEffect(() => {
            const fetchRequest = async () => {
                await axiosClient.get('/sanctum/csrf-cookie');
                const response = await axiosClient.get('/api/friend-request');
                setRequests(response.data);
            }
            fetchRequest();
    },[]);
    async function setStatus() {
        setStatusProfile(!statusProfile);
        setUser({
            ...user,
            status: user.status === 'Available' ? 'Busy' : 'Available'
        });        
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.post('/api/set-satus');
        } catch (error) {
            console.error('Error set status request:', error);
        }
    }
    function selectedFunc(){
        switch (selected) {
            case 'chats':
                return(
                    <>
                        <div className="dashboard-page-two-div-h4"><h4>Chats</h4></div>
                        <div className="dashboard-page-two-search-div">
                            <div className="dashboard-page-two-search-div-svg"><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg></div>
                            <input type='text' placeholder='Search messages or users'/>
                        </div>
                        <div className="dashboard-page-two-online-users">
                            {
                                onlineUsers.length > 0? (
                                    onlineUsers.map((item,i) => {
                                        return(
                                            <div className="dashboard-page-two-online-users-selected-user" key={i}>
                                                <div className='dashboard-page-two-online-users-selected-user-online-all-status'>
                                                <img 
                                                    src={`https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} 
                                                    alt={item.name} 
                                                />
                                                {item.state === 'online' ? (
                                                    item.status === 'Available' ? (
                                                        <div className="dashboard-page-two-online-users-selected-user-online-available">
                                                        </div>
                                                    ) : (
                                                        <div className="dashboard-page-two-online-users-selected-user-online-busy">
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="dashboard-page-two-online-users-selected-user-online-offline">
                                                    </div>
                                                )}
                                                </div>
                                                <h5>{item.name}</h5>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className='dashboard-page-two-online-users-loading-wait'>
                                        {!onlineDone && (
                                            <>
                                                <div className="dashboard-page-two-online-users-selected-user-loading-wait">
                                                    <div></div>
                                                </div>
                                                <div className="dashboard-page-two-online-users-selected-user-loading-wait">
                                                    <div></div>
                                                </div>
                                                <div className="dashboard-page-two-online-users-selected-user-loading-wait">
                                                    <div></div>
                                                </div>
                                                <div className="dashboard-page-two-online-users-selected-user-loading-wait">
                                                    <div></div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            }
                        </div>
                        <div className="dashboard-page-two-div-h3"><h4>Recent</h4></div>
                        <div className="dashboard-page-two-div-contacts-messages">
                            {
                                friends.length > 0? (
                                    friends.map((item,i) => {
                                        return(
                                            <div className="dashboard-page-two-div-contacts-messages-item" key={i} onClick={() => getMessages(item)}>
                                                <div className="dashboard-page-two-div-contacts-messages-item-image">
                                                {item.state === 'online' ? (
                                                    item.status === 'Available' ? (
                                                        <div className="dashboard-page-two-div-contacts-messages-item-image-chack-state-user-online-available">
                                                            <img 
                                                                src={item.picture.startsWith('blob') ? item.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} 
                                                                alt={item.name} 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="dashboard-page-two-div-contacts-messages-item-image-chack-state-user-online-busy">
                                                            <img 
                                                                src={item.picture.startsWith('blob') ? item.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} 
                                                                alt={item.name} 
                                                            />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="dashboard-page-two-div-contacts-messages-item-image-chack-state-user-offline">
                                                        <img 
                                                            src={item.picture.startsWith('blob') ? item.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} 
                                                            alt={item.name} 
                                                        />
                                                    </div>
                                                )}
                                                </div>
                                                <div className="dashboard-page-two-div-contacts-messages-item-content">
                                                    <div className="dashboard-page-two-div-contacts-messages-item-content-top">
                                                        <h4>{item.name}</h4>
                                                        <span>{formatTime(item.last_activity)}</span>
                                                    </div>
                                                    <div className="dashboard-page-two-div-contacts-messages-item-content-bottom">Nice to meet you</div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className='dashboard-page-two-div-contacts-messages-loading-wait'>
                                        {!friendDone && (
                                            <>
                                                <div className="dashboard-page-two-div-contacts-messages-item-loading-wait">
                                                <div className="dashboard-page-two-div-contacts-messages-item-image-loading-wait-parent">
                                                    <div className='dashboard-page-two-div-contacts-messages-item-image-loading-wait'></div>
                                                </div>
                                                <div className="dashboard-page-two-div-contacts-messages-item-content-loading-wait">
                                                </div>
                                            </div>
                                                    <div className="dashboard-page-two-div-contacts-messages-item-loading-wait">
                                                    <div className="dashboard-page-two-div-contacts-messages-item-image-loading-wait-parent">
                                                        <div className='dashboard-page-two-div-contacts-messages-item-image-loading-wait'></div>
                                                    </div>
                                                    <div className="dashboard-page-two-div-contacts-messages-item-content-loading-wait">
                                                    </div>
                                                </div>
                                                <div className="dashboard-page-two-div-contacts-messages-item-loading-wait">
                                                <div className="dashboard-page-two-div-contacts-messages-item-image-loading-wait-parent">
                                                    <div className='dashboard-page-two-div-contacts-messages-item-image-loading-wait'></div>
                                                </div>
                                                <div className="dashboard-page-two-div-contacts-messages-item-content-loading-wait">
                                                </div>
                                            </div>
                                            <div className="dashboard-page-two-div-contacts-messages-item-loading-wait">
                                            <div className="dashboard-page-two-div-contacts-messages-item-image-loading-wait-parent">
                                                <div className='dashboard-page-two-div-contacts-messages-item-image-loading-wait'></div>
                                            </div>
                                            <div className="dashboard-page-two-div-contacts-messages-item-content-loading-wait">
                                            </div>
                                        </div>
                                            </>
                                        )}
                                    </div>
                                )
                            }
                        </div>
                    </>
                )
                break;
            case 'profile':
                return(
                    <div className='dashboard-profile-section'>
                        <div className='dashboard-profile-section-top'>
                            <div className='dashboard-profile-section-top-one'>
                                <h4>My Profile</h4>
                                <div className='dashboard-profile-section-top-one-actions'>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                </div>
                            </div>
                            <div className='dashboard-profile-section-top-two'>
                                <div className='dashboard-profile-section-top-two-image'>
                                    {
                                        user.picture? <img src={user.picture.startsWith('blob') ? user.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${user.picture.split('/').pop()}`} alt={user.name} />: null
                                    }
                                </div>
                                <h4>{user.name}</h4>
                                <div className='dashboard-profile-section-top-two-status'>
                                    <div className='dashboard-profile-section-top-two-status-profile'></div>
                                    <h4>Active</h4>
                                </div>
                            </div>
                            
                        </div>
                        <div className='dashboard-profile-section-bottom'>
                            <div className='dashboard-profile-section-bottom-one'>
                                <p>If several languages coalesce, the grammar of the resulting language is more simple and regular than that of the individual.</p>
                                <div className='dashboard-profile-section-bottom-one-about-user' onClick={() => setAbout(!about)}>
                                <div className='dashboard-profile-section-bottom-one-about-user-one'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill="#3f414d"><path d="M313-40q-24 0-46-9t-39-26L24-280l33-34q14-14 34-19t40 0l69 20v-327q0-17 11.5-28.5T240-680q17 0 28.5 11.5T280-640v433l-98-28 103 103q6 6 13 9t15 3h167q33 0 56.5-23.5T560-200v-160q0-17 11.5-28.5T600-400q17 0 28.5 11.5T640-360v160q0 66-47 113T480-40H313Zm7-280v-160q0-17 11.5-28.5T360-520q17 0 28.5 11.5T400-480v160h-80Zm120 0v-120q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440v120h-80Zm40 200H285h195Zm160-400q-91 0-168-48T360-700q35-84 112-132t168-48q91 0 168 48t112 132q-35 84-112 132t-168 48Zm0-80q57 0 107.5-26t82.5-74q-32-48-82.5-74T640-800q-57 0-107.5 26T450-700q32 48 82.5 74T640-600Zm0-40q-25 0-42.5-17.5T580-700q0-25 17.5-42.5T640-760q25 0 42.5 17.5T700-700q0 25-17.5 42.5T640-640Z"/></svg>
                                <h4>About</h4>
                                </div>
                                {
                                    about? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3f414d"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" className='about-svg'/></svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3f414d"><path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z" className='about-svg'/></svg>
                                }
                                </div>
                               {about? (
                                 <div className='dashboard-profile-section-bottom-one-about-preview'>
                                 <div className='dashboard-profile-section-bottom-one-about-previe-infos'>
                                     <h4>Name</h4>
                                     <h5>{user.name}</h5>
                                 </div>
                                 <div className='dashboard-profile-section-bottom-one-about-previe-infos'>
                                 <h4>Email</h4>
                                 <h5>{user.email}</h5>
                                 </div>
                                 <div className='dashboard-profile-section-bottom-one-about-previe-infos'>
                                 <h4>Time</h4>
                                 <h5>{formatTime(user.created_at)}</h5>
                                 </div>
                                 <div className='dashboard-profile-section-bottom-one-about-previe-infos'>
                                 <h4>Location</h4>
                                 <h5>California, USA</h5>
                                 </div>
                             </div>
                               ) : null}
                            </div>
                        </div>
                    </div>
                )
                break;
            case 'users':
                return(
                    <>
                        <div className="dashboard-page-two-div-h4"><h4>Users</h4></div>
                        <div className="dashboard-page-two-search-div">
                            <div className="dashboard-page-two-search-div-svg"><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg></div>
                            <input type='text' placeholder='Search users..'/>
                        </div>
                        <div className='dashboard-users-map'>
                            {
                                users.map((item,i) => {
                                    return(
                                        <div className="dashboard-page-two-div-contacts-messages-item-users" key={i}>
                                        <div className="dashboard-page-two-div-contacts-messages-item-image-users">
                                            <div>
                                                {
                                                    item.picture? <img src={item.picture.startsWith('blob') ? item.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} alt={item.name} />: null
                                                }
                                            </div>
                                        </div>
                                        <div className="dashboard-page-two-div-contacts-messages-item-content-users">
                                            <div className="dashboard-page-two-div-contacts-messages-item-content-users-left">
                                            <div className="dashboard-page-two-div-contacts-messages-item-content-top">
                                                <h4>{item.name}</h4>
                                            </div>
                                            <div className="dashboard-page-two-div-contacts-messages-item-content-bottom">Hello to my profile</div>
                                            </div>
                                            <div className='dashboard-page-two-div-contacts-messages-item-content-users-right' onClick={() => show === item.id? setShow(0) : setShow(item.id)}>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                            </div>
                                        </div>
                                        {show === item.id? (
                                            <div className='dashboard-page-two-div-contacts-messages-item-users-showup-add'>
                                                <ul>
                                                    <li onClick={() => addFriend(item.id)}>
                                                        Add friend
                                                    </li>
                                                    <li>
                                                        Block
                                                    </li>
                                                    <li>
                                                        Remove
                                                    </li>
                                                </ul>
                                            </div>
                                        ) : null}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </>
                )
                break;
            case 'settings':
                return(
                    <div className='dashboard-profile-section'>
                    <div className='dashboard-profile-section-top'>
                        <div className='dashboard-profile-section-top-one'>
                            <h4>Settings</h4>
                        </div>
                        <div className='dashboard-profile-section-top-two'>
                            <div className='dashboard-profile-section-top-two-image-settings'>
                                {
                                    user.picture? <img src={user.picture.startsWith('blob') ? user.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${user.picture.split('/').pop()}`} alt={user.name} />: null
                                }
                                <form>
                                    <label htmlFor="upload-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#000000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="upload-button"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </form>
                            </div>
                            <h4>{user.name}</h4>
                            <div className='dashboard-profile-section-top-two-status'>
                                <h4>{user.status}</h4>
                                <svg onClick={() => setStatusProfile(!statusProfile)} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="15px" fill="rgb(116 120 141)"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                                {statusProfile? (
                                            <div className='dashboard-page-two-div-contacts-messages-item-users-showup-add-status'>
                                                <ul>
                                                    <li onClick={() => setStatus()}>
                                                        {user.status === 'Available'? 'Busy' : 'Available' }
                                                        
                                                    </li>
                                                </ul>
                                            </div>
                                        ) : null}
                            </div>
                        </div>
                        
                    </div>
                    <div className='dashboard-profile-section-bottom'>
                    </div>
                </div>
                )
                break;
            case 'group':
                return(
                    <>
                    <div className="dashboard-page-two-div-h4"><h4>Received friend request</h4></div>
                    <div className="dashboard-page-two-search-div">
                        <div className="dashboard-page-two-search-div-svg"><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg></div>
                        <input type='text' placeholder='Search users..'/>
                    </div>
                    <div className='dashboard-users-map'>
                        {
                            requests.map((item,i) => {
                                return(
                                    <div className="dashboard-page-two-div-contacts-messages-item-users" key={i}>
                                    <div className="dashboard-page-two-div-contacts-messages-item-image-users">
                                        <div>
                                            {
                                                item.picture? <img src={item.picture.startsWith('blob') ? item.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${item.picture.split('/').pop()}`} alt={item.name} />: null
                                            }
                                        </div>
                                    </div>
                                    <div className="dashboard-page-two-div-contacts-messages-item-content-users">
                                        <div className="dashboard-page-two-div-contacts-messages-item-content-users-left">
                                        <div className="dashboard-page-two-div-contacts-messages-item-content-top">
                                            <h4>{item.name}</h4>
                                        </div>
                                        <div className="dashboard-page-two-div-contacts-messages-item-content-bottom">Hello to my profile</div>
                                        </div>
                                        <div className='dashboard-page-two-div-contacts-messages-item-content-users-right' onClick={() => showinvitation === item.id? setShowinvitation(0) : setShowinvitation(item.id)}>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                        </div>
                                    </div>
                                    {showinvitation === item.id? (
                                        <div className='dashboard-page-two-div-contacts-messages-item-users-showup-add'>
                                            <ul>
                                                <li onClick={() => acceptFriend(item.id)}>
                                                    Accept friend
                                                </li>
                                                <li>
                                                    Block
                                                </li>
                                                <li>
                                                    Remove
                                                </li>
                                            </ul>
                                        </div>
                                    ) : null}
                                    </div>
                                )
                            })
                        }
                    </div>
                </>
                )
                break;
            default:
                break;
        }
    };
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    useEffect(() => {
        selectedFunc()
    },[selected]);
    useEffect(() => {
        const setVh = () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        return () => {
            window.removeEventListener('resize', setVh);
        };
    }, []);
    useEffect(() => {
            const fetchUsers = async () => {
                await axiosClient.get('/sanctum/csrf-cookie');
                const response = await axiosClient.post('/api/users',{'user': user});
                setUsers(response.data);
            }
            fetchUsers();
    },[]);
    useEffect(() => {
        if (!logged) {
          navigate('/login')
        }
      },[logged])
      if (loginLoading || Object.keys(user).length === 0) {
          return <Loader />;
      }
    return (
        <div className="dashboard-page">
            <div className="dashboard-page-one">
                <div className="dashboard-page-one-top"><img src={logo} alt='logo'/></div>
                <div className="dashboard-page-one-center">
                    <ul>
                        <li className='dashboard-page-ul-li-svg-before-profile' id={selected === 'profile'? 'selected-one': null} onClick={() => {setSelected('profile');setActiveChat(false)}}><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg></li>
                        <li className='dashboard-page-ul-li-svg-before-chat' id={selected === 'chats'? 'selected-one': null} onClick={() => {setSelected('chats');getOnlineUsers();fetchFriends()}}><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg></li>
                        <li className='dashboard-page-ul-li-svg-before-group' id={selected === 'group'? 'selected-one': null} onClick={() => {setSelected('group');setActiveChat(false)}}><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0 320Zm0-400Z"/></svg></li>
                        <li className='dashboard-page-ul-li-svg-before-contact' id={selected === 'users'? 'selected-one': null} onClick={() => {setSelected('users');setActiveChat(false)}}><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="M160-40v-80h640v80H160Zm0-800v-80h640v80H160Zm320 400q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm70-80q45-56 109-88t141-32q77 0 141 32t109 88h70v-480H160v480h70Zm118 0h264q-29-20-62.5-30T480-280q-36 0-69.5 10T348-240Zm132-280q-17 0-28.5-11.5T440-560q0-17 11.5-28.5T480-600q17 0 28.5 11.5T520-560q0 17-11.5 28.5T480-520Zm0 40Z"/></svg></li>
                        <li className='dashboard-page-ul-li-svg-before-settings' id={selected === 'settings'? 'selected-one': null} onClick={() => {setSelected('settings');setActiveChat(false)}}><svg xmlns="http://www.w3.org/2000/svg" height="" viewBox="0 -960 960 960" width="" fill=""><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg></li>
                    </ul>
                </div>
                <div className="dashboard-page-one-bottom">
                    <ul className="dashboard-page-one-bottom-ul">
                        <li className='dark-mode-list-svg'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="" fill=""><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg></li>
                        <li>
                            <div className='dashboard-image-profile' onClick={() => setClicked(!clicked)}>
                                {
                                    user.picture? <img src={user.picture.startsWith('blob') ? user.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${user.picture.split('/').pop()}`} alt={user.name} />: null
                                }
                                {
                                    clicked? (
                                        <div className="dashboard-page-one-bottom-popup-logout">
                                    <ul>
                                        <li onClick={() => setSelected('profile')}>
                                            Profile
                                            <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="rgb(116 120 141)"><path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z"/></svg>
                                        </li>
                                        <li onClick={() => setSelected('settings')}>
                                            Settings
                                            <svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="14px" fill="rgb(116 120 141)"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
                                        </li>
                                        <li onClick={() => logout()}>
                                            Log out
                                            <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="rgb(116 120 141)"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
                                        </li>
                                    </ul>
                                </div>
                                    ): null
                                }
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="dashboard-page-two">
                {selectedFunc()}
            </div>
            <div className="dashboard-page-three">
                {
                    activeChat? (
                        <>
                            <div className="dashboard-page-three-fixed-navbar">
                    <div className="dashboard-page-three-fixed-navbar-one">
                        {
                            isMobile === 1? (
                                <svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="" onClick={() => hideChat()}><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>
                            ) : null
                        }
                        {
                            selectedFriend.picture? <img src={selectedFriend.picture.startsWith('blob') ? selectedFriend.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${selectedFriend.picture.split('/').pop()}`} alt={selectedFriend.name} />: null
                        }
                        <h4>{selectedFriend.name}</h4>
                         {selectedFriend.state === 'online' ? (
                            selectedFriend.status === 'Available' ? (
                                <div className="navbar-status"></div>
                            ) : (
                                <div className="navbar-status-busy"></div>
                            )
                        ) : (
                            <div className="navbar-status-offline"></div>
                        )}
                    </div>
                </div>
                <div className="dashboard-page-three-one">
                {
                    messages.length > 0 ? (
                                messages.map((item, i) => {
                                    if (item.sender_id === user.id) {
                                        return (
                                            <div className="dashboard-page-three-one-item-connected" key={i}>
                                                <div className="dashboard-page-three-one-item-content-connected-div">
                                                <div className="dashboard-page-three-one-item-content-connected">
                                                    <div className="dashboard-page-three-one-item-content-string-connected">
                                                        {item.content}
                                                    </div>
                                                    <div className="dashboard-page-three-one-item-content-time-connected">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#74788d">
                                                            <path d="m614-310 51-51-149-149v-210h-72v240l170 170ZM480-96q-79.38 0-149.19-30T208.5-208.5Q156-261 126-330.96t-30-149.5Q96-560 126-630q30-70 82.5-122t122.46-82q69.96-30 149.5-30t149.55 30.24q70 30.24 121.79 82.08 51.78 51.84 81.99 121.92Q864-559.68 864-480q0 79.38-30 149.19T752-208.5Q700-156 629.87-126T480-96Zm0-384Zm.48 312q129.47 0 220.5-91.5Q792-351 792-480.48q0-129.47-91.02-220.5Q609.95-792 480.48-792 351-792 259.5-700.98 168-609.95 168-480.48 168-351 259.5-259.5T480.48-168Z"/>
                                                        </svg>
                                                        {formatTime(item.created_at)}
                                                    </div>
                                                </div>
                                                </div>
                                                <div className="dashboard-page-three-one-item-image">
                                                    {
                                                        user.picture? <img src={user.picture.startsWith('blob') ? user.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${user.picture.split('/').pop()}`} alt={user.name} />: null
                                                    }
                                                </div>
                                                <div className="dashboard-page-three-one-item-sender-name-connected">
                                                    {item.sender_name}
                                                </div>
                                            </div> 
                                        );
                                    } else {
                                        return (
                                            <div className="dashboard-page-three-one-item" key={i}>
                                                <div className="dashboard-page-three-one-item-image">
                                                    {
                                                        selectedFriend.picture? <img src={selectedFriend.picture.startsWith('blob') ? selectedFriend.picture : `https://react-laravel.infinityfreeapp.com/chat-app/storage/app/public/images/${selectedFriend.picture.split('/').pop()}`} alt={selectedFriend.name} />: null
                                                    }
                                                </div>
                                                <div className="dashboard-page-three-one-item-content">
                                                    <div className="dashboard-page-three-one-item-content-string">
                                                        {item.content}
                                                    </div>
                                                    <div className="dashboard-page-three-one-item-content-time">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#ffffff80">
                                                            <path d="m614-310 51-51-149-149v-210h-72v240l170 170ZM480-96q-79.38 0-149.19-30T208.5-208.5Q156-261 126-330.96t-30-149.5Q96-560 126-630q30-70 82.5-122t122.46-82q69.96-30 149.5-30t149.55 30.24q70 30.24 121.79 82.08 51.78 51.84 81.99 121.92Q864-559.68 864-480q0 79.38-30 149.19T752-208.5Q700-156 629.87-126T480-96Zm0-384Zm.48 312q129.47 0 220.5-91.5Q792-351 792-480.48q0-129.47-91.02-220.5Q609.95-792 480.48-792 351-792 259.5-700.98 168-609.95 168-480.48 168-351 259.5-259.5T480.48-168Z"/>
                                                        </svg>
                                                        {formatTime(item.created_at)}
                                                    </div>
                                                </div>
                                                <div className="dashboard-page-three-one-item-sender-name">
                                                    {item.sender_name}
                                                </div>
                                            </div> 
                                        );
                                    }
                                })
                    ) : (
                        <div className="no-messages">
                            {fetchDone ? null : (
                                <>
                                <div className="dashboard-page-three-one-item">
                                    <div className="dashboard-page-three-one-item-image-loading-wait">
                                    </div>
                                    <div className="dashboard-page-three-one-item-content-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string">
                                            
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time">
                                            
                                        </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-loading-wait">
                                    </div>
                                </div>
                                
                                <div className="dashboard-page-three-one-item-connected-loading-wait">
                                    <div className="dashboard-page-three-one-item-content-connected-div">
                                    <div className="dashboard-page-three-one-item-content-connected-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string-connected">
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time-connected">
                                        </div>
                                    </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-image-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-image-loading-wait-connected"></div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait"></div>
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item">
                                    <div className="dashboard-page-three-one-item-image-loading-wait">
                                    </div>
                                    <div className="dashboard-page-three-one-item-content-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string">
                                            
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time">
                                            
                                        </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-loading-wait">
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item-connected-loading-wait">
                                    <div className="dashboard-page-three-one-item-content-connected-div">
                                    <div className="dashboard-page-three-one-item-content-connected-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string-connected">
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time-connected">
                                        </div>
                                    </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-image-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-image-loading-wait-connected"></div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait"></div>
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item">
                                    <div className="dashboard-page-three-one-item-image-loading-wait">
                                    </div>
                                    <div className="dashboard-page-three-one-item-content-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string">
                                            
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time">
                                            
                                        </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-loading-wait">
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item-connected-loading-wait">
                                    <div className="dashboard-page-three-one-item-content-connected-div">
                                    <div className="dashboard-page-three-one-item-content-connected-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string-connected">
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time-connected">
                                        </div>
                                    </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-image-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-image-loading-wait-connected"></div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait"></div>
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item">
                                    <div className="dashboard-page-three-one-item-image-loading-wait">
                                    </div>
                                    <div className="dashboard-page-three-one-item-content-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string">
                                            
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time">
                                            
                                        </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-loading-wait">
                                    </div>
                                </div>
                                <div className="dashboard-page-three-one-item-connected-loading-wait">
                                    <div className="dashboard-page-three-one-item-content-connected-div">
                                    <div className="dashboard-page-three-one-item-content-connected-loading-wait">
                                        <div className="dashboard-page-three-one-item-content-string-connected">
                                        </div>
                                        <div className="dashboard-page-three-one-item-content-time-connected">
                                        </div>
                                    </div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-image-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-image-loading-wait-connected"></div>
                                    </div>
                                    <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait-parent">
                                        <div className="dashboard-page-three-one-item-sender-name-connected-loading-wait"></div>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                    )
                }
                <div ref={messagesEndRef} />

                </div>
                <div className="dashboard-page-three-two">
                        <div className="dashboard-page-three-two-one">
                        <div className="dashboard-page-three-two-one-one">
                        <input type='text' placeholder='Enter Message...' value={content} onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                sendMessageTo(selectedFriend.id, selectedFriend.name);
                            }
                        }}
                        />
                        </div>
                        <div className="dashboard-page-three-two-one-operations">
                        <div className="dashboard-page-three-two-one-operations-send-btn" onClick={() => sendMessageTo(selectedFriend.id,selectedFriend.name)}><box-icon name='send' type='solid' color='#ffffff' ></box-icon></div>
                        </div>
                    </div>
                </div>
                        </>
                    ) : <div className='dashboard-three-chat-active-false'>
                            <img src='https://react-laravel.infinityfreeapp.com/storage/app/public/images/2823236.jpg' alt='homeè_page_image'/>
                            <h1>Stay Connected, Anytime, Anywhere</h1>
                        </div>
                }
            </div>
        </div>
    );
}