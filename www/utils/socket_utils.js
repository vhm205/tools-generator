// Lọc những phần tử trùngg nhau trong mảng
const filterOverlapItem = (array) => {
    var arrReduce = array.reduce(
        (accumulator, currentItem) => accumulator.includes(currentItem) ? accumulator : [...accumulator, currentItem],
        []
    );
    return arrReduce;
}

// FUNCTION MAP DATA TO SEND SOCKET: SERVER SEND TO CLIENT
const mapSocketIDAndData = (arrReceiver, event, data, usersConnected, io) => {
    // lọc lại các phần tử trùng nhau trong mảng  
    if(arrReceiver){
        arrReceiver = filterOverlapItem(arrReceiver);
        // Duyệt mảng người nhận
        arrReceiver.forEach(receiver =>{

            // Kiểm tra xem họ có online hay không để gửi tín hiệu
            for(let i = 0; i < usersConnected.length; i++){

                // Biến kiểm tra để phát hiện khi gặp đúng receiver thì xử lý truyền tin
                // Khi truyền tin xong thì break để thoát nhằm tối ưu hiệu suất
                let isEnd = false;
                if(usersConnected[i].userID && usersConnected[i].userID.toString() === receiver.toString()){
                    // Mỗi userID sẽ có thể mở 1 hoặc nhiều tab trình duyệt nên có nhiều socket
                    // Vì vậy cần gửi tới cho các socket của receiver này
                    usersConnected[i].socketID.forEach(_socketID=>{
                        //==================B3: SERVER PHÁT TÍN HIỆU TRẢ VỀ CÁC CLIENT==================//
                        io.to(`${_socketID}`).emit(event, data);
                    });
                    isEnd = true;
                };
                if(isEnd){
                    break;
                }
            }
            
        })
    }
}

const getUserNotConnected = (usersConnected, userOfAgency) => {
    /**
     * Lấy danh sách User không kết nối => Gửi cloud messaging
     *      1// Lấy danh sách tất cả user;
     *      2// Map với danh sách user đang onl
     *          => Lấy ra danh sách ID không onl
     */
    let listIDUserConnected  = usersConnected.map( user => user.userID);

    let listUserNotConnected = userOfAgency.map( user => {
        if(!listIDUserConnected.includes(user) ) {
            return user._id;
        }
    });
    return listUserNotConnected;
}

const sendToClient = (receiver, event, data, usersConnected, io) => {
	if(receiver){
		const receiverConnected = usersConnected.find(user => user.userID.toString() === receiver.toString());
		const listSocketOfUser 	= receiverConnected && receiverConnected.socketID;

        console.log({ 
            [`GỬI SOCKET ĐẾN USER`]: receiver,
            receiverConnected,
            [`Số lượng Connect của User hiện tại`]: listSocketOfUser && listSocketOfUser.length
        });

		if(listSocketOfUser && listSocketOfUser.length){
			listSocketOfUser.map(socketID => io.to(`${socketID}`).emit(event, data));
		}
	}
}

module.exports = {
    filterOverlapItem,
    mapSocketIDAndData,
	sendToClient,
    getUserNotConnected
}
