import React from 'react';
import { StyleSheet, Text, View, Dimensions, ToastAndroid, AsyncStorage } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
  listenOrientationChange as loc,
  removeOrientationListener as rol
} from 'react-native-responsive-screen';
import { Slider, Icon, Header } from 'react-native-elements';
import init from 'react_native_mqtt';
 
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  reconnect: true,
  sync : {
  }
});

export default class App extends React.Component {
  constructor(props){
    super(props);
    let clientId = "ws" + Math.random();
    const client = new Paho.MQTT.Client('m12.cloudmqtt.com', 37683, clientId); 
    client.onConnectionLost = this.onConnectionLost;
    client.onMessageArrived = this.onMessageArrived;
    client.connect({
      useSSL: true, 
      userName:'esidoxde', 
      password:'73JEqVyKJUpF', 
      onSuccess: this.onConnect
    });
    this.state = {
      value: 50,
      usuario: 'placa2',
      password: '123456789',
      client,
      cargando: true,
      conectado: false,
    };
  }

  onConnect = ()=> {
    const { client } = this.state;
    client.subscribe('#');
    ToastAndroid.show('Conectado!', ToastAndroid.SHORT);
  }
  
  onConnectionLost = (responseObject)=> {
    if (responseObject.errorCode !== 0) {
      ToastAndroid.show("onConnectionLost:"+responseObject.errorMessage, ToastAndroid.SHORT);
      this.setState({
        conectado: false
      });
    }
  }

  onMessageArrived = (message)=> {
    if(!this.state.cargando){      
      let resJSON = JSON.parse(message.payloadString);
      if(resJSON.id == "1"){
        if(resJSON.usuario == "Roberto"){
          if(resJSON.sensor == "Dimmer"){            
            if(resJSON.valor){
              this.setState(() => {
                return {
                  value: (parseFloat(resJSON.valor) / 2),
                };
              });
            }           
          }
        }
      }
    }   
  }

  componentDidMount() {
    loc(this);
    this.setState({
      cargando: false
    });
  }
  
  componentWillUnMount() {
    rol();
    this.setState({
      cargando: true
    });
  }

  dimming = (value)=>{
    const { client } = this.state;
    if(this.state.conectado){
      this.setState(() => {
        return {
          value: parseFloat(value),
        };
      });
      mensaje = `{"id":"1","usuario":"Roberto","sensor":"Dimmer","valor":"${value}"}`;
      message = new Paho.MQTT.Message(mensaje);
      message.destinationName = 'Comando';
      client.send(message);
    }
  }
  
  render() {
    const {value, client} = this.state;
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      responsiveBox: {
        width: wp('84.5%'),
        flexDirection: 'column',
        justifyContent: 'space-around',
      },
      text: {
        color: '#343434',
        alignSelf: 'center',
      },
      encabezado:{
        fontSize: 18,
        fontWeight: 'bold',
      },
      track: {
        height: 2,
        borderRadius: 1,
      },
      thumb: {
        width: 30,
        height: 30,
        borderRadius: 30 / 2,
        backgroundColor: '#2F2F2F',
        shadowColor: 'black',
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 2,
        shadowOpacity: 0.35,
      }
    });

    return (
      <View style={styles.container}>
        <View style={styles.responsiveBox}>
          <Text style={[styles.text, styles.encabezado]}>Dimmer AC</Text>   
          <Icon
            size={125}
            name='lightbulb-o'
            type='font-awesome'
            color='#D6B70E'
          />
          <View>    
            <Slider
              step={1}
              minimumValue={1}
              maximumValue={100}
              onValueChange={(value)=>{
                this.setState(() => {
                  return {
                    value: parseFloat(value),
                  };
                });
              }}
              onSlidingComplete={()=>{
                const intencidad = (parseFloat(value) * 2);
                mensaje = `{"id":"1","usuario":"Roberto","sensor":"Dimmer","valor":"${intencidad}"}`;
                message = new Paho.MQTT.Message(mensaje);
                message.destinationName = 'Comando';
                client.send(message);
              }}
              value={value}
              trackStyle={styles.track}
              thumbStyle={styles.thumb}
              minimumTrackTintColor='#2F2F2F'
              maximumTrackTintColor='#b7b7b7'
            />
          </View>
          <Text style={styles.text}>Intencidad {String(value)} %</Text>
        </View>
      </View>
    );
  }
}
