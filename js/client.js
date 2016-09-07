'use strict';

var socket = null;
var my_login_name = '';
var my_socket_id = '';

$(function () {
    // ログイン画面表示
    $('#loginForm').show();
    $('#chatForm').hide();

    // ログイン時
    $('#btnLogin').on('click', function (e) {

        my_login_name = $('#login_name').val();

        if ($("#loginForm").valid() === true) {

            // チャット画面表示
            $('#loginForm').hide();
            $('#chatForm').show();

            // ソケット初期化
            initSocket();
        }
        e.preventDefault();
    });

    // チャットメッセージをサーバへ通知
    $('#btnChat').on('click', function (e) {
        var chat_message = $('#chat_message').val();
        if (chat_message !== '') {
            socket.emit('say', {
                login_name: my_login_name,
                chat_message: chat_message
            });
        }
        $('#chat_message').val('');
        e.preventDefault();
    });

    // 入力中かどうかのステータスをサーバへ通知
    $('#chat_message').on('keydown', function (e) {
        // キーダウンをサーバへ通知
        socket.emit('keydown', {
            login_name: my_login_name
        });
    });
    $('#chat_message').on('keyup', function (e) {
        // キーアップをサーバへ通知
        socket.emit('keyup', {});
    });
});

// チャットメッセージ追加
function appendChat(message, position, login_name) {
    $('#chatLogs').append('<div class="' + position + '_balloon">' + message + '</div>');
    // 末尾にスクロール
    $('html,body').animate({
        scrollTop: $('#bottomDiv').offset().top
    }, 0);
}

// ソケット初期化
function initSocket() {
    socket = io.connect();

    // 接続時にソケットIDをサーバから取得する
    socket.on('onConnect', function (data) {
        // 自分のソケットIDを記憶
        my_socket_id = data.socket_id;

        // ログインIDとソケットIDを紐付け
        socket.emit('onConnect', {
            socket_id: socket.id,
            login_name: my_login_name
        });
    });

    // チャットメッセージの同期
    socket.on('say', function (data) {
        if (my_socket_id !== data.socket_id) {
            appendChat(data.chat_message, 'left', data.login_name);
        } else {
            appendChat(data.chat_message, 'right', data.login_name);
        }
    });

    // 他ユーザがログインしたときにメッセージとして通知
    socket.on('join', function (data) {
        appendChat(data.login_name + 'さんがログインしました。', 'left', '');
    });

    // 他ユーザの入力中のときにステータスとして通知
    socket.on('keydown', function (data) {
        changeChatStatus(data.login_name + 'さんが入力中です。');
    });
    socket.on('keyup', function (data) {
        changeChatStatus('');
    });

    // 他ユーザがログアウトしたときにメッセージとして通知
    socket.on('logout', function (data) {
        appendChat(data.login_name + 'さんがログアウトしました。', 'left', '');
    });

    // ログインしたことをサーバへ通知する
    socket.emit('join', {
        login_name: my_login_name
    });
}

// ステータス文字表示
function changeChatStatus(message) {
    $('#chatStatus').html('<div>' + message + '</div>');
}

// バリデーション
$("#loginForm").validate(
    {
        rules: {
            login_name: {
                required: true
            }
        },
        messages: {
            login_name: "ログイン名を入力してください"
        }
    }
);
