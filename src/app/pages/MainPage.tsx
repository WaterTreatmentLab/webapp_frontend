import { MainFooter } from 'app/components/MainFooter';
import { MainNavbar } from 'app/components/MainNavbar';
import { MainSidebar } from 'app/components/MainSidebar';
import { colorConstants } from 'styles/colorConstants';
import { ModelPage } from 'app/pages/ModelPage';
import { SettingsPage } from 'app/pages/SettingsPage';
import React, { useState, useEffect } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { Notification, Container } from 'rsuite';
import { useToaster } from 'rsuite/toaster';

const websocketBaseAddress = 'ws://127.0.0.1:8000/';

function getNotification(status, header, message) {
  return (
    <Notification type={status} header={header}>
      {message}
    </Notification>
  );
}

function getNotificationContent(notification) {
  console.log(notification);
  const target = notification.target;
  const targetype = notification.target[0];
  const value = notification.value;
  const messages = {
    V: {
      1: `Otwórz zawór ${target}`,
      0: `Zamknij zawór ${target}`,
    },
    P: {
      1: `Włącz pompę ${target}`,
      0: `Wyłącz pompę ${target}`,
    },
  };
  console.log(targetype, value, messages[targetype][value]);
  return messages[targetype][value];
}

export const MainPage = props => {
  const [activeTab, setActiveTab] = useState(true);
  const [currentScenario, setCurrentScenario] = useState('');
  const toaster = useToaster();

  const notificationsclient = new W3CWebSocket(
    websocketBaseAddress + 'subscribe/notifications',
  );
  const stateClient = new W3CWebSocket(
    websocketBaseAddress + 'subscribe/state',
  );

  stateClient.onerror = () => {
    toaster.push(
      getNotification('error', 'Error', 'Error connecting to state socket'),
      { placement: 'bottomEnd' },
    );
  };

  notificationsclient.onerror = () => {
    toaster.push(
      getNotification(
        'error',
        'Error',
        'Error connecting to notification socket',
      ),
      { placement: 'bottomEnd' },
    );
  };

  useEffect(() => {
    stateClient.onopen = () => {
      console.log('WebSocket Client Connected');
      // TODO include cookie
      // can't happen
      stateClient.send(
        JSON.stringify({ cookie: '', workstation: 'testworkstation' }),
      );
    };

    stateClient.onmessage = message => {
      console.log('Otrzymano stan stacji');
      const state = JSON.parse(JSON.parse(message.data));
      setCurrentScenario(state.currentScenario);
      console.log(state);
    };

    notificationsclient.onopen = () => {
      console.log('WebSocket Client Connected');
      // TODO include cookie
      notificationsclient.send(
        JSON.stringify({ cookie: '', workstation: 'testworkstation' }),
      );
    };

    notificationsclient.onmessage = message => {
      const messagejson = JSON.parse(JSON.parse(message.data));
      console.log(messagejson);
      if (message.type == 'connectionerror') {
        toaster.push(getNotification('error', 'Error', messagejson.data), {
          placement: 'bottomEnd',
        });
      }
      if (messagejson.task.action == 'end_scenario') {
        setCurrentScenario('');
        return;
      }
      switch (messagejson.status) {
        case 'success':
          toaster.push(
            getNotification(
              'success',
              'Zadanie zostało wykonane',
              getNotificationContent(messagejson.task),
            ),
            { placement: 'bottomEnd' },
          );
          break;
        case 'conditions_not_met':
          toaster.push(
            getNotification(
              'error',
              'Warunki zadania nie zostały spełnione',
              getNotificationContent(messagejson.task),
            ),
            { placement: 'bottomEnd' },
          );
          break;
        case 'connector_error':
          toaster.push(
            getNotification(
              'error',
              'Błąd podczas wykonywania zadania',
              'Serwer nie mógł się połączyć ze stacją',
            ),
            { placement: 'bottomEnd' },
          );
          break;
      }
    };
  }, []);

  const [activeKey, setActiveKey] = React.useState('model');

  return (
    <>
      <Container>
        <MainNavbar
          activeKey={activeKey}
          onSelect={setActiveKey}
          setIsLoggedIn={props.setIsLoggedIn}
        />
        {
          {
            model: <ModelPage />,
            details: <div>Dane szczegółowe</div>,
            docs: <div>Dokumentacja</div>,
            settings: <SettingsPage />, // only for admin user
          }[activeKey]
        }
        <MainFooter />
      </Container>
    </>
  );
};

const styles = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as 'column',
  justifyContent: 'space-around',
};

const tableStyles = {
  borderSpacing: '0',
  width: '90%',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '40px',
  border: '1px solid #ddd',
};

const rowStyle = {
  textAlign: 'left',
  padding: '16px',
} as React.CSSProperties;

const moreStyle = {
  textAlign: 'left',
  padding: '16px',
  backgroundColor: colorConstants.lightGrey,
} as React.CSSProperties;
